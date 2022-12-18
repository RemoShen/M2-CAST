const VENDOR_PREFIXES = ["", "webkit", "Moz", "MS", "ms", "o"];

/**
 * @private
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
export const prefixed = (obj: any, property: string) => {
  let prefix;
  let prop;
  let camelProp = property[0].toUpperCase() + property.slice(1);

  let i = 0;
  while (i < VENDOR_PREFIXES.length) {
    prefix = VENDOR_PREFIXES[i];
    prop = prefix ? prefix + camelProp : property;

    if (prop in obj) {
      return prop;
    }
    i++;
  }
  return undefined;
};
