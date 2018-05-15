describe(`README`, () => {
    test(`readme usage`, () => {
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
         *  Initializes the model's prototype with getters/setters for properties, consolidates inherited properties and defaults
         *  validates properties not to conflict with already defined ones in super classes or reserved by Model class.
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
    });

    test(`readme usage`, () => {
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
    });

    test(`readme usage`, () => {
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
    });
});

