---
sidebar_position: 4
description: Database
---

# Database tables

## users
|Columns|id|
|---|---|
|Type|varchar(64)|

## modules
|Columns|id|name|description|enabled|
|---|---|---|---|---|
|Type|int (autoincrement)|varchar(255)|varchar(255)|boolean|

## nodes
|Columns|dbId|module|id|type|x|y|data|
|---|---|---|---|---|---|---|---|
|Type|int (autoincrement)|int|int|varchar(255)|int|int|varchar(255)|

## edges
|Columns|dbId|module|id|from|to|
|---|---|---|---|---|---|
|Type|int (autoincrement)|varchar(255)|int|int|int|

## interactions
|Columns|id|date|success|error|userId|
|---|---|---|---|---|---|
|Type|varchar(64)|date|boolean|varchar(255)(can be null)|varchar(64)|

## moduleVariables
|Columns|id|module|name|value|
|---|---|---|---|---|
|Type|int (autoincrement)|int|varchar(255)|varchar(255)|