"use strict";

const jestEach = require('jest-each').default;
const {Model} = require('boxed-model');

const aDefaults = {a1: 0, a2: "2", a3: null,};
const bDefaults = {b1: 0, b2: "2", b3: null,};

class A extends Model {
    constructor(options) {
        super(options);
    }

    mapRequest(req) {
        delete req.a1;
        req.a1_ = this.a1;
    }

    mapResponse(res) {
        this.a1 = res.a1_;
    }

    static get defaultValues() {
        return aDefaults;
    }
}

Model.defineModel(A);

class B extends A {
    constructor(options) {
        super(options);
    }

    mapRequest(req) {
        delete req.b1;
        req.b1_ = this.b1;
    }

    mapResponse(res) {
        this.b1 = res.b1_;
    }

    static get defaultValues() {
        return bDefaults;
    }
}

Model.defineModel(B);

class State {
    constructor() {
        this.state = {};
    }

    setState(partial, callback) {
        Object.assign(this.state, partial);
        if (callback) {
            callback();
        }
    }
}

describe(`model inherit properties`, () => {
    test(`model A`, () => {
        const a = new A();
        expect(Object.keys(a.props)).toEqual(Object.keys(aDefaults));
    });

    test(`model B`, () => {
        const b = new B();
        expect(Object.keys(b.props)).toEqual(["a1", "a2", "a3", "b1", "b2", "b3"]);
    });
});

describe(`model initializes to defaults`, () => {
    test(`model A`, () => {
        const a = new A();
        expect(a.props).toEqual(Object.assign({}, aDefaults));
    });
    test(`model B`, () => {
        const b = new B();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults));
    });
});

describe(`model saves properties`, () => {
    test(`model A`, () => {
        const a = new A();
        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.save();
        expect(a.props).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3"}));
    });

    test(`model B`, () => {
        const b = new B();
        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.save();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3"}));
    });
});

describe(`model cancels properties`, () => {
    test(`model A`, () => {
        const a = new A();
        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.cancel();
        a.save();
        expect(a.props).toEqual(Object.assign({}, aDefaults));
    });

    test(`model B`, () => {
        const b = new B();
        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.cancel();
        b.save();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults));
    });
});

describe(`model maps to request`, () => {
    test(`model A`, () => {
        const a = new A();
        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.exists = true;

        a.save();
        const req = a.toRequest();
        const expReq = Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3"});
        expReq.a1_ = expReq.a1;
        delete expReq.a1;
        expect(req).toEqual(expReq);
    });

    test(`model B`, () => {
        const b = new B();
        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.exists = true;

        const req = b.toRequest();
        const expReq = Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3"});
        expReq.a1_ = expReq.a1;
        delete expReq.a1;
        expReq.b1_ = expReq.b1;
        delete expReq.b1;
        expect(req).toEqual(expReq);
    });
});

describe(`model loads response not saved automatically`, () => {
    test(`model A`, () => {
        const a = new A();
        const res = {
            a1_: 2,
            a2: "3",
            a3: "a3",
        };
        a.loadResponse(res);
        expect(a.props).toEqual(Object.assign({}, aDefaults));
        a.save();
        expect(a.props).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3", "exists": true}));
    });

    test(`model B`, () => {
        const b = new B();
        const res = {
            a1_: 2,
            a2: "3",
            a3: "a3",
            b1_: 4,
            b2: "4",
            b3: "b3",
        };
        b.loadResponse(res);
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults));
        b.save();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3", "exists": true}));
    });
});

describe(`model invalid response fields ignored`, () => {
    test(`model A`, () => {
        const a = new A();
        const res = {
            a1_: 2,
            a2_: "3",
            a3_: "a3",
        };
        a.loadResponse(res);
        a.save();
        expect(a.props).toEqual(Object.assign({}, aDefaults, {a1: 2, "exists": true}));
    });

    test(`model B`, () => {
        const b = new B();
        const res = {
            a1_: 2,
            a2_: "3",
            a3_: "a3",
            b1_: 4,
            b2_: "4",
            b3_: "b3",
        };
        b.loadResponse(res);
        b.save();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, b1: 4, "exists": true}));
    });
});

describe(`model get/set props`, () => {
    test(`model A`, () => {
        const props = {};
        const a = new A({
            getProps() {
                return props;
            },
            setProps(value, boxed, callback) {
                Object.assign(props, value);
                if (callback) {
                    return callback();
                }
            },
        });

        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.save();
        expect(props).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3"}));
    });

    test(`model B`, () => {
        const props = {};
        const b = new B({
            getProps() {
                return props;
            },
            setProps(value, boxed, callback) {
                Object.assign(props, value);
                if (callback) {
                    return callback();
                }
            },
        });

        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.save();
        expect(props).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3"}));
    });
});

describe(`model getState/setState props`, () => {
    test(`model A`, () => {
        const stateHolder = new State();
        const a = new A({
            stateHolder: stateHolder,
            stateName: "a",
        });

        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.save();
        expect(stateHolder.state.a).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3"}));
    });

    test(`model B`, () => {
        const stateHolder = new State();
        const b = new B({
            stateHolder: stateHolder,
            stateName: "b",
        });

        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.save();

        expect(stateHolder.state.b).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3"}));
    });
});

describe(`model getState/setState props re-hydrate from props`, () => {
    test(`model A`, () => {
        const stateHolder = new State();
        const a = new A({
            stateHolder: stateHolder,
            stateName: "a",
        });
        a.a1 = 2;
        a.a2 = "3";
        a.a3 = "a3";
        a.save();

        const aCopy = new A({
            stateHolder: stateHolder,
            stateName: "a",
        });
        expect(stateHolder.state.a).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3"}));

        const req = aCopy.toRequest();
        expect(req).toEqual({a1_: 2, a2: "3", a3: "a3"});
    });

    test(`model B`, () => {
        const stateHolder = new State();
        const b = new B({
            stateHolder: stateHolder,
            stateName: "b",
        });

        b.a1 = 2;
        b.a2 = "3";
        b.a3 = "a3";
        b.b1 = 4;
        b.b2 = "4";
        b.b3 = "b3";
        b.save();

        const bCopy = new B({
            stateHolder: stateHolder,
            stateName: "b",
        });
        expect(stateHolder.state.b).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3"}));

        const req = bCopy.toRequest();
        expect(req).toEqual({"a1_": 2, "a2": "3", "a3": "a3", "b1_": 4, "b2": "4", "b3": "b3"});
    });
});

describe(`model loads response exists set`, () => {
    test(`model A`, () => {
        const stateHolder = new State();
        const a = new A({
            stateHolder: stateHolder,
            stateName: "a",
        });
        const res = {
            a1_: 2,
            a2: "3",
            a3: "a3",
        };
        a.loadResponse(res);
        a.save();
        expect(a.props).toEqual(Object.assign({}, aDefaults, {a1: 2, a2: "3", a3: "a3", "exists": true}));
    });

    test(`model B`, () => {
        const stateHolder = new State();
        const b = new B({
            stateHolder: stateHolder,
            stateName: "b",
        });
        const res = {
            a1_: 2,
            a2: "3",
            a3: "a3",
            b1_: 4,
            b2: "4",
            b3: "b3",
        };
        b.loadResponse(res);
        b.save();
        expect(b.props).toEqual(Object.assign({}, aDefaults, bDefaults, {a1: 2, a2: "3", a3: "a3", b1: 4, b2: "4", b3: "b3", "exists": true}));
    });
});

describe(`throws on reserved fields`, () => {
    test(`model C`, () => {
        class C extends B {
            constructor(options) {
                super(options);
            }

            static get defaultValues() {
                return {exists: 0};
            }

            static get modelProps() {
                return {exists: 0};
            }
        }

        expect(() => {
            return Model.defineModel(C);
        }).toThrow("IllegalArgument, 'exists' reserved Model property cannot be redefined");
    });
});

describe(`throws on inherited fields`, () => {
    test(`model C`, () => {
        class C extends B {
            constructor(options) {
                super(options);
            }

            static get defaultValues() {
                return {a1: 0};
            }

            static get modelProps() {
                return {a1: 0};
            }
        }

        expect(() => {
            return Model.defineModel(C);
        }).toThrow("IllegalArgument, 'a1' defined in class A extends Model cannot be redefined");
    });
});

