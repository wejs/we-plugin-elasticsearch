# We.js elastic plugin integration (we-plugin-elasticsearch)

> This plugin integrate we.js project with elastic search for help create, update and delete records in elastic search

in development!

### TODO:

- reset index
- create, update or delete all records to elastic search
- administration page
- table to register record sync progress

## Installation:

TODO!

## Configuration

file:**config/local.js**:

```js
  //...
    elasticsearch: {
      index: 'wejs',
      // connection configurations
      connection: {
        host: 'localhost:9200',
        log: 'trace'
      },
      // models for crud in elastic search
      models: {
        article: true // auto update in elastic search on CRUD
      }
    }
  // ...
```

## Links

> * We.js site: http://wejs.org

## License

[MIT license](https://github.com/wejs/we-core/blob/master/LICENSE.md)