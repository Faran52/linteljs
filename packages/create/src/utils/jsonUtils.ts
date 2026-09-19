/**
 * A parsed JSON object, which is the one boundary shape this package meets in every ring: a config it reads back,
 * a `package.json` it merges into, a manifest, an agent settings file. Each caller narrows to its own shape and
 * declares that in its own return type; what they share is the question of whether there is an object there at all.
 *
 * The prototype is the whole check. Four of the five guards this replaced also tested `!Array.isArray(value)`,
 * which never decided anything: an array's prototype is `Array.prototype`, so it is already refused, as is a class
 * instance and an `Object.create(null)` record.
 */
export const isJsonObject = (value: unknown): value is object => {
  return typeof value === 'object'
    && value !== null
    && Object.getPrototypeOf(value) === Object.prototype;
};
