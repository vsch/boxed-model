# Version History

[TOC]: # " "

- [0.1.2](#012)
- [0.1.0](#010)


## 0.1.2

* Fix: in constructor only initialize missing or undefined properties from model's
  `defaultValues`. Now creating an instance on existing props source will re-hydrate the model,
  not initialize it.

## 0.1.0

initial commit

