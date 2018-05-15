# Version History

[TOC]: # " "

- [0.1.6](#016)
- [0.1.4](#014)
- [0.1.2](#012)
- [0.1.0](#010)


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

