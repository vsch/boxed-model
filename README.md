# boxed-model

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Implements a base Model whose property storage and modification is compatible with React
component state, model inheritance, optional mapping to back-end request shape and mapping from
back-end response shape.

Immutability is provided by the [`boxed-state` module](https://github.com/vsch/boxed-state/blob/master/README.md)

## Install

Use [npm](https://npmjs.com/) to install.

```sh
npm install boxed-model --save
```

## Usage

[![NPM](https://nodei.co/npm/boxed-model.png)](https://www.npmjs.com/package/boxed-model)

### `require('boxed-model')` base Model

Is a base model which implements immutability, commit and cancel changes and property
definitions.

The model constructor takes options which specify how the model properties are stored. Default
implementation will store the model properties in the `props` property.

If options specify `{ getProps: function(); setProps: function(modified, boxed, callback), }`
then `getProps` and `setProps` functions will be used for property getter/setter.

If options define `{ stateHolder: obj, stateName: prop, }` the model instance will use
`stateHolder.state[stateName]` to get model properties and `stateHolder.setState({[stateName]:
props});` to save properties for the model. This allows the model to get/set its properties from
a React component's state. Set the `stateHolder` to React components `this` and provide the name
under which to store the model's properties.

```javascript
const {Model} = require('boxed-model');

class Book extends Model {
    constructor(options) {
        super(options);
    }

    static get defaultValues() {
        return {bookId: 0, title: "", price: 0.00, pages: 0,};
    }

    /**
     * Used to change model properties to server request properties/shape
     *
     * Only properties not part of model need to be changed, others are already copied
     * May need to delete properties which are replaced
     *
     * @param req     server request
     */
    mapRequest(req) {
        delete req.bookId;
        req.id = this.bookId;
    }

    /**
     * Used to change server response properties/shape to model properties
     *
     * Only properties not part of model need to be changed, others are already copied
     *
     * @param res     server response
     */
    mapResponse(res) {
        this.bookId = res.id;
    }
}

/**
 *  Initializes the model's prototype with getters/setters for properties, consolidates inherited properties, defaults
 *  validates properties not to be already defined in super classes or reserved by Model class.
 */
Model.defineModel(Book);

const newBook = new Book();
expect(newBook.props).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

// properties not changed until saved.
newBook.price = 10.00;
expect(newBook.props).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

newBook.save();
expect(newBook.props).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

// property changes can be cancelled
newBook.title = "New Book";
newBook.cancel();
expect(newBook.props).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

newBook.title = "New Book";
newBook.save();
expect(newBook.props).toEqual({bookId: 0, title: "New Book", price: 10.00, pages: 0,});

const req = newBook.toRequest();
expect(req).toEqual({id: 0, title: "New Book", price: 10.00, pages: 0,});

// after loading from a server response, need to save.
// after loading exists property is set to true
newBook.loadResponse({id: 10, title: "Book Title", price: 5.00, pages: 25,});
newBook.save();
expect(newBook.props).toEqual({bookId: 10, title: "Book Title", price: 5.00, pages: 25, exists: true});
```

When creating a model, options specify storage type. Default when no options are provided the
model properties will be stored in the model's `props` property.

You can provide `getProps` and `setProps` functions to have these used for property
getter/setter:

```javascript
const {Model} = require('boxed-model');

class Book extends Model {
    constructor(options) {
        super(options);
    }

    static get defaultValues() {
        return {bookId: 0, title: "", price: 0.00, pages: 0,};
    }
    
    mapRequest(req) {
        delete req.bookId;
        req.id = this.bookId;
    }
    
    mapResponse(res) {
        this.bookId = res.id;
    }
}

Model.defineModel(Book);

// this book instance will save its properties in local variable
const props = {};
const newBook = new Book({
    getProps() {
        return props;
    },
    setProps(modified, boxed, callback) {
        Object.assign(props, modified);
        if (callback) return callback();
    },
});

expect(props).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

// properties not changed until saved.
newBook.price = 10.00;
expect(props).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

newBook.save();
expect(props).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

// property changes can be cancelled
newBook.title = "New Book";
newBook.cancel();
expect(props).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

newBook.title = "New Book";
newBook.save();
expect(props).toEqual({bookId: 0, title: "New Book", price: 10.00, pages: 0,});

const req = newBook.toRequest();
expect(req).toEqual({id: 0, title: "New Book", price: 10.00, pages: 0,});

// after loading from a server response, need to save.
// after loading exists property is set to true
newBook.loadResponse({id: 10, title: "Book Title", price: 5.00, pages: 25,});
newBook.save();
expect(props).toEqual({bookId: 10, title: "Book Title", price: 5.00, pages: 25, exists: true});

```

Options of stateHolder/stateName will use `stateHolder.state[stateName]` to get model properties
and `stateHolder.setState({[stateName]: props});` to save properties for the model. This allows
the model to get/set its properties in a React component state.

```javascript
const {Model} = require('boxed-model');

class Book extends Model {
    constructor(options) {
        super(options);
    }

    static get defaultValues() {
        return {bookId: 0, title: "", price: 0.00, pages: 0,};
    }

    mapRequest(req) {
        delete req.bookId;
        req.id = this.bookId;
    }

    mapResponse(res) {
        this.bookId = res.id;
    }
}

Model.defineModel(Book);

class Component {
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

// this book instance will save its properties in component.state.book and use component.setState({book: props}) for saving its properties
const component = new Component();
const newBook = new Book({
    stateHolder:component,
    stateName:"book",
});

expect(component.state.book).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

// properties not changed until saved.
newBook.price = 10.00;
expect(component.state.book).toEqual({bookId: 0, title: "", price: 0.00, pages: 0,});

newBook.save();
expect(component.state.book).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

// property changes can be cancelled
newBook.title = "New Book";
newBook.cancel();
expect(component.state.book).toEqual({bookId: 0, title: "", price: 10.00, pages: 0,});

newBook.title = "New Book";
newBook.save();
expect(component.state.book).toEqual({bookId: 0, title: "New Book", price: 10.00, pages: 0,});

const req = newBook.toRequest();
expect(req).toEqual({id: 0, title: "New Book", price: 10.00, pages: 0,});

// after loading from a server response, need to save.
// after loading exists property is set to true
newBook.loadResponse({id: 10, title: "Book Title", price: 5.00, pages: 25,});
newBook.save();
expect(component.state.book).toEqual({bookId: 10, title: "Book Title", price: 5.00, pages: 25, exists: true});
```

[React]: https://reactjs.org
[Redux]: https://redux.js.org

