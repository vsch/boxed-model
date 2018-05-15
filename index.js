const {boxState} = require("boxed-state");
const {objSome, mergeDefaults} = require('obj-each-break');
const {isArray, isFunction, isObject, isObjectLike, forAllPrototypes, callPrototypeChainDown} = require('util-type-funcs');

const UNDEFINED = void 0;

const reservedProps = {
    exists: true,
    dirty: true,
    props: true,
    props_$: true,

    // methods
    save: true,
    cancel: true,
    isDirty: true,
    // mapResponse: true,  // don't need protection they are always called through the prototype
    // mapRequest: true,   // don't need protection they are always called through the prototype

    toRequest: true,
    loadResponse: true,
};

function getModelProp(key) {
    return function () {
        return this.props_$[key].$_value;
    };
}

function setModelProp(key) {
    return function (value) {
        this.props_$[key] = value;
    };
}

function getModelBooleanProp(key) {
    return function () {
        return !!this.props_$[key].$_value;
    };
}

function setModelBooleanProp(key) {
    return function (value) {
        this.props_$[key] = !!value;
    };
}

function getModelPropDelta() {
    return this.props_$.$_delta;
}

function addPropKeys(propKeys, props, reservedProps, propValue) {
    props = isArray(props) ? props : isObjectLike(props) ? Object.keys(props) : null;
    if (!props) return;

    const keys = isArray(props) ? props : Object.keys(props);
    const iMax = keys.length;
    for (let i = 0; i < iMax; i++) {
        const key = keys[i];
        if (reservedProps && reservedProps.hasOwnProperty(key)) {
            throw `IllegalArgument, '${key}' ${reservedProps[key]} cannot be redefined`;
        }

        propKeys[key] = isFunction(propValue) ? propValue(key) : propValue;
    }
}

function deletePropKeys(propKeys, props) {
    props = isArray(props) ? props : isObjectLike(props) ? Object.keys(props) : null;
    if (!props) return;

    const keys = isArray(props) ? props : Object.keys(props);
    const iMax = keys.length;
    for (let i = 0; i < iMax; i++) {
        const key = keys[i];
        delete propKeys[key];
    }
}

function addPropDescription(propDescriptions, props, reservedProps) {
    addPropKeys(propDescriptions, props, reservedProps, key => Object.freeze({
        get: getModelProp(key),
        set: setModelProp(key),
        configurable: false,
    }));
}

/**
 * Construct a Model
 * @param options {object|undefined}  - options for defining model instance property get/set types
 *
 * Default options: results in properties of the model saved in the model's property named "props"
 *
 * When options defines:
 * {
 *     getProps: function(),        // function to get current immutable properties of the model, this is the model instance
 *     setProps: function(props, boxed, callback),   // function to set immutable properties of the model, this is the model instance
 *                                  NOTE: boxed and callback both can be undefined if props are being set directly without going through props_$
 * }
 *
 * Alternative is to define a model which saves its props in component state:
 * {
 *     stateName: string|symbol,   // property name holding the properties for the model
 *     stateHolder: object,        // component instance, whose [state][stateName] holds the properties of the model instance,
 *                                 // saving of properties will be done via stateHolder.setState({ [stateName]: modified, }, callback);
 * }
 *
 * NOTE: options must be undefined or take one of two acceptable forms or an exception is thrown
 */
class Model {
    constructor(options) {
        const self = this;

        // properties, treat as immutable
        if (options === undefined) {
            // vsch: defined as separate properties to allow WebStorm to recognize them, if defining using defineProperties they show up as unknown
            Object.defineProperty(this, "props", {
                value: {},
                writable: true,
                configurable: false,
            });

            Object.defineProperty(this, "props_$", {
                value: boxState(
                    () => this.props,
                    (modified, boxed, callback) => {
                        this.props = modified;
                        if (callback) {
                            return callback();
                        }
                    }),
                writable: false,
                configurable: false,
            });
        } else {
            if (options.hasOwnProperty('getProps') && options.hasOwnProperty('setProps')) {
                const getProps = options.getProps.bind(this);
                const setProps = options.setProps.bind(this);

                Object.defineProperties(this, {
                    "props": {
                        get: getProps,
                        set: value => {
                            this.props_$.cancel();
                            setProps.call(this, value);
                        },
                        configurable: false,
                    },

                    "props_$": {
                        value: boxState(
                            getProps,
                            (modified, boxed, callback) => {
                                this.props_$.cancel();
                                return setProps(modified, boxed, callback);
                            }),
                        writable: false,
                        configurable: false,
                    },
                });
            } else if (options.hasOwnProperty('stateName') && options.hasOwnProperty('stateHolder')) {
                const stateHolder = options.stateHolder;
                const stateName = options.stateName;

                Object.defineProperties(this, {
                    "props": {
                        get() { return stateHolder.state[stateName]; },
                        set(value) {
                            this.props_$.cancel();
                            stateHolder.setState({[stateName]: value,});
                        },
                        configurable: false,
                    },

                    "props_$": {
                        value: boxState(
                            () => stateHolder.state[stateName],
                            (modified, boxed, callback) => {
                                stateHolder.setState({[stateName]: modified,}, callback);
                            }),
                        writable: false,
                        configurable: false,
                    },
                });

            } else {
                throw `IllegalArgument, options must be { getState: function(), setState: function(modified, boxed, callback),} or { stateName: propertyName, stateHolder: objectInstance,}, got ${JSON.stringify(options)}`;
            }
        }

        if (!isObjectLike(this.props)) {
            // define initial values as empty object using setProps, if you don't want this behavior then make sure
            // the getProps returns an object like value when creating a model
            this.props = {};
        }

        // only set values which are missing right on the props
        const props = Object.assign({}, this.props);
        mergeDefaults.call(props, this.constructor.defaultValues, 1, false, true);
        this.props = props;
        this.props_$.cancel();

        // can bind but should not be necessary unless these are passed as function refs
        // this.save = this.save.bind(this);
        // this.cancel = this.cancel.bind(this);
        // this.isDirty = this.isDirty.bind(this);
        // this.mapResponse = this.mapResponse.bind(this);
        // this.mapRequest = this.mapRequest.bind(this);
        // this.toRequest = this.toRequest.bind(this);
        // this.loadResponse = this.loadResponse.bind(this);
    }

    /**
     * Copy properties from src to dst
     *
     * @param src             source object for properties
     * @param dst             destination object for property copy
     * @param props           array of property keys to copy
     * @param defaults {object|undefined} if provided then any properties not copied will reset to defaults or be deleted if they are not part of the copy process.
     *
     * NOTE: will do a shallow copy of defaults properties which are arrays or objects
     */
    static copyFromTo(src, dst, props, defaults) {
        if (!isObjectLike(src)) throw `IllegalArgument, source is not object, got ${src}`;
        if (!isObjectLike(dst)) throw `IllegalArgument, destination is not object, got ${dst}`;

        const defaultValues = defaults ? Object.assign({}, defaults) : {};
        const keys = props;
        if (keys) {
            if (!isArray(keys)) throw `IllegalArgument, keysForCopy should return an array of property keys, got ${keys}`;
            const iMax = keys.length;
            for (let i = 0; i < iMax; i++) {
                const key = keys[i];
                const srcValue = src[key];
                if (srcValue !== UNDEFINED) {
                    dst[key] = srcValue;
                    delete defaultValues[key];
                } else {
                    delete dst[key];
                }
            }
        }

        if (defaults) {
            // set missing to defaults and remove extras
            const keys = Object.keys(defaultValues);
            const iMax = keys.length;
            for (let i = 0; i < iMax; i++) {
                const key = keys[i];
                const defaultValue = defaultValues[key];
                if (defaultValue !== UNDEFINED) {
                    dst[key] = isArray(defaultValue) ? Object.assign([], defaultValue) : isObject(defaultValue) ? Object.assign({}, defaultValue) : defaultValue;
                } else {
                    delete dst[key];
                }
            }
        }
    }

    /**
     * Call this function superClass Model to define Model derived class and freeze it
     *
     * @param modelSubClass {Model}   new model class to initialize
     */
    static defineModel(modelSubClass) {
        const defaultValues = modelSubClass.hasOwnProperty("defaultValues") && modelSubClass.defaultValues || {};
        const copiedProps = modelSubClass.hasOwnProperty("copiedProps") && modelSubClass.copiedProps || defaultValues;
        const modelProps = modelSubClass.hasOwnProperty("modelProps") && modelSubClass.modelProps || {};

        if (defaultValues && !isObject(defaultValues)) {
            throw `IllegalArgument, defaultValues argument must be a plain object, got ${defaultValues}`;
        }

        if (copiedProps && !isObject(copiedProps) && !isArray(copiedProps)) {
            throw `IllegalArgument, copiedProps argument must be a plain array or object, got ${copiedProps}`;
        }

        if (modelProps && !isObject(modelProps) && !isArray(modelProps)) {
            throw `IllegalArgument, modelProps argument must be a plain array or object, got ${copiedProps}`;
        }

        const resolvedDefaults = {};
        const resolvedCopiedProps = {};
        const resolvedReservedProps = {};
        const propDescriptions = {};

        const parentModel = Object.getPrototypeOf(modelSubClass.prototype);
        forAllPrototypes.call(parentModel.constructor, (prototype) => {
            if (prototype.constructor === Object) return;

            addPropKeys(resolvedCopiedProps, prototype.constructor.copiedProps);
            Object.assign(resolvedDefaults, prototype.constructor.defaultValues);
            Object.assign(propDescriptions, prototype.constructor.modelProps);
            let className = "" + prototype.constructor;
            const bracePos = className.indexOf("{");
            if (bracePos > 0) {
                className = className.substr(0, bracePos).trim();
            }

            addPropKeys(resolvedReservedProps, prototype.constructor.modelProps, undefined, `defined in ${className}`);
        });

        addPropKeys(resolvedReservedProps, reservedProps, undefined, `reserved Model property`);

        // modelProps are a union of defaults, copiedProps and modelProps, but defaults and copiedProps have any resolved props removed before
        // being added to modelProps
        const unionModelProps = {};
        addPropKeys(unionModelProps, defaultValues);
        addPropKeys(unionModelProps, copiedProps);
        deletePropKeys(unionModelProps, resolvedReservedProps);
        addPropKeys(unionModelProps, modelProps);

        addPropDescription(propDescriptions, unionModelProps, resolvedReservedProps);

        Object.assign(resolvedDefaults, defaultValues);
        addPropKeys(resolvedCopiedProps, copiedProps);

        if (modelSubClass === Model) {
            // base model
            propDescriptions.exists = Object.freeze({
                get: getModelBooleanProp("exists"),
                set: setModelBooleanProp("exists"),
                configurable: false,
            });

            propDescriptions.dirty = Object.freeze({
                get: getModelPropDelta,
                configurable: false,
            });
        }

        const copyProps = Object.keys(resolvedCopiedProps);

        Object.defineProperty(modelSubClass, "defaultValues", {value: Object.freeze(resolvedDefaults), writable: false, configurable: false,});
        Object.defineProperty(modelSubClass, "copiedProps", {value: Object.freeze(copyProps), writable: false, configurable: false,});
        Object.defineProperty(modelSubClass, "modelProps", {value: Object.freeze(propDescriptions), writable: false, configurable: false,});

        Object.defineProperties(modelSubClass.prototype, propDescriptions);
        Object.freeze(modelSubClass);
    }

    /**
     * Commit current tracked property values as original. Changes after this point will track relative to these values.
     * @param callback {function}   callback to pass to  boxedState.save()
     * @return {*}     value returned by props_$.save(callback)
     */
    save(callback) {
        return this.props_$.save(callback);
    }

    /**
     * Reset all tracked property values back to original values
     *
     * @return {Model} this
     */
    cancel() {
        this.props_$.cancel();
        return this;
    }

    /**
     * Returns true if the model's tracked attributes have been modified
     *
     * @param attributes {*}   array, object, string or undefined, returns true if any of the tracked attributes are modified
     */
    isDirty(attributes) {
        const modified = this.props_$.$_modified;
        if (modified !== undefined) {
            const props = this.props;
            if (isArray(attributes)) {
                return attributes.some(prop => props[prop] !== modified[prop]);
            } else if (isObjectLike(attributes)) {
                return objSome.call(attributes, (value, prop) => props[prop] !== modified[prop]);
            } else {
                const prop = attributes;
                return props[prop] !== modified[prop];
            }
        }
        return false;
    }

    /**
     * Map Model fields to request which do not map directly and remove any which are not needed
     *
     * This method will be called in all classes in the inheritance chain with the base classes called before sub-classes
     *
     * @this {Model} model instance which to map to request
     * @param request
     */
    mapRequest(request) {

    };

    /**
     * Map server response fields which are not directly mapped to model fields
     *
     * @this {Model}            model instance whose props to map from server response
     * @param response
     */
    mapResponse(response) {

    };

    /**
     *  Convert Model to shape expected by back-end request using mappingToRequest
     *
     *  @this {Model} model instance
     *  @return object to be used for request
     */
    toRequest() {
        const request = {};
        const defaultValues = null;
        Model.copyFromTo(this, request, this.constructor.copiedProps, defaultValues);

        // handle custom mapping
        callPrototypeChainDown.call(this, 'mapRequest', request);

        return request;
    }

    /**
     * Load Server response shape to this Model
     *
     *  @this {Model}            model instance to load with server response
     *  @param response   server response shape of the model
     *  @param clearToDefaults {boolean} if true model will first be cleared to default values
     *
     *  @return {Model}    model's this
     */
    loadResponse(response, clearToDefaults = true) {
        this.cancel();
        const defaultValues = clearToDefaults ? this.constructor.defaultValues : null;
        Model.copyFromTo(response, this, this.constructor.copiedProps, defaultValues);

        // handle custom mapping
        callPrototypeChainDown.call(this, 'mapResponse', response);

        // it comes from the server so it is assumed to exist
        this.exists = true;
        return this;
    }
}

// create the base model for all models
Model.defineModel(Model);

module.exports.Model = Model;

