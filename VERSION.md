# Version History

[TOC]: # " "

- [0.1.14](#0114)
- [0.1.13](#0113)
- [0.1.12](#0112)
- [0.1.10](#0110)
- [0.1.8](#018)
- [0.1.6](#016)
- [0.1.4](#014)
- [0.1.2](#012)
- [0.1.0](#010)


## 0.1.14

* Fix: update dependencies

## 0.1.13

* Fix: typos in package.json description

## 0.1.12

* Fix: update jest version
* Fix: update `util-string-wrap`
* Fix: update `util-type-funcs`
* Fix: update `for-each-break`
* Fix: update `obj-each-break`
* Fix: update `boxed-out`
* Fix: update `boxed-state`

## 0.1.10

* Fix: update dependencies

## 0.1.8

* Change: `Model.copyFromTo`, `props` argument to array of keys from previous object whose keys
  were extracted dynamically.

## 0.1.6

* Fix: model props are now the union of `defaultValues`, `copiedProps` and `modelProps` defined
  on the model, with any reserved props and inherited props removed from the `defaultValues` and
  `copiedProps` before adding them to `modelProps`

## 0.1.4

* Fix: update dependencies

## 0.1.2

* Fix: in constructor only initialize missing or undefined properties from model's
  `defaultValues`. Now creating an instance on existing props source will re-hydrate the model,
  not initialize it.

## 0.1.0

initial commit

