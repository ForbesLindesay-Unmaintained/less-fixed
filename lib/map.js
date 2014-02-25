'use strict';

module.exports = Map;
function Map() {
  this._keys = [];
  this._values = [];
}

Map.prototype.delete = function (key) {
  var index = this._keys.indexOf(key);
  if (index !== -1) {
    this._keys.slice(i, 1);
    this._values.slice(i, 1);
  }
};
Map.prototype.get = function (key) {
  var index = this._keys.indexOf(key);
  if (index !== -1) {
    return this._values[index];
  } else {
    return undefined;
  }
};
Map.prototype.has = function (key) {
  return this._keys.indexOf(key) !== -1;
};
Map.prototype.set = function (key, value) {
  var index = this._keys.indexOf(key);
  if (index !== -1) {
    this._values[index] = value;
  } else {
    this._keys.push(key);
    this._values.push(value);
  }
};