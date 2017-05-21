/**
 * Class responsible for generating enums for string values
 */
class EnumGenerator {
  /**
   * Constructor.
   */
  constructor() {
    this.nextId = 1;
    this.map = new Map();
  }

  /**
   * Generates or returns an enum.
   * @param  {Object} value Object to be mapped.
   * @return {String}        The new or existing enum associated with the value.
   */
  generate(value) {
    //attempts to get an already generated id for the object
    let id = this.map.get(value);

    if (!id) {
      //new item, generate a new id
      id = this.nextId++;
      // store it backwards to make it easier to find existing values
      this.map.set(value, id);
    }
    // returns the identified enum
    return {id: id, description: value}
  }
}

module.exports = EnumGenerator;
