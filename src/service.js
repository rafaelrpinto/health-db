let redis = require("redis");
let bunyan = require("bunyan");
let Promise = require("bluebird");
// project dependencies
let EnumGenerator = require('./enum')

// async redis client
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

// logger setup
let log = bunyan.createLogger({name: "redis-logger"});

// More options on: https://www.npmjs.com/package/redis#rediscreateclient
let redisClient = redis.createClient();

// Redis error listener
redisClient.on("error", function(err) {
  log.error({err: err});
});

/**
 * Service responsible for operations related to health facilities.
 */
class HealthFacilitiesService {

  /**
   * Constructor.
   */
  constructor() {
    // initiates the internal id generators
    this.facilityTypeEnumGenerator = new EnumGenerator();
    this.openingHoursEnumGenerator = new EnumGenerator();
    this.servicesEnumGenerator = new EnumGenerator();
  }

  /**
   * Saves a health facility.
   * @param  {Object} healthFacility Facility to be saved.
   */
  saveFacility(healthFacility) {
    // generates enums
    let facilityTypeEnum = this.facilityTypeEnumGenerator.generate(healthFacility.type);
    let openingHoursEnum = this.openingHoursEnumGenerator.generate(healthFacility.openingHours);

    // groups redis commands
    let multi = redisClient.batch();

    // adds the opening hours to the domain set
    multi.zadd(['facility_opening_hours_list', openingHoursEnum.id, `${openingHoursEnum.id}:${openingHoursEnum.description}`]);
    // adds the facility type to the domain set
    multi.zadd(['facility_type_list', facilityTypeEnum.id, `${facilityTypeEnum.id}:${facilityTypeEnum.description}`]);
    // adds the city to out domain
    multi.sadd(`cities:${healthFacility.address.state}`, healthFacility.address.city);

    // array with ids of the services
    let facilityServices = [];

    // creates the services indexes
    for (let service of healthFacility.services) {
      // generates th enum
      let serviceEnum = this.servicesEnumGenerator.generate(service.trim());

      // adds the service to the domain set
      multi.zadd(['service_list', serviceEnum.id, `${serviceEnum.id}:${serviceEnum.description}`]);

      //associate with service per state
      multi.zadd([`service:${serviceEnum.id}:${healthFacility.address.state}`, healthFacility.id, healthFacility.id]);
      // and also per city to allow more accurate searching
      multi.zadd([`service:${serviceEnum.id}:${healthFacility.address.state}:${healthFacility.address.city}`, healthFacility.id, healthFacility.id]);

      //adds the numeric id to be associated with the hash later
      facilityServices.push(serviceEnum.id);
    }

    // stores the health facility as hash
    multi.hmset(`facility:${healthFacility.id}`, hash(healthFacility, facilityTypeEnum, openingHoursEnum, facilityServices));

    // adds the health facility to the geographic index
    multi.geoadd('geo_facilities', healthFacility.longitude, healthFacility.latitude, healthFacility.id);

    // executes all commands in the same request
    return multi.execAsync();
  }
}

/**
 * Generates the hahs argument for a facility.
 * @param  {Object} healthFacility   Facility to be stored.
 * @param  {Object} facilityTypeEnum Type of the facility.
 * @param  {Object} openingHoursEnum Opening hours of the facility.
 * @param  {Array} facilityServices Services provided by the facility.
 * @return {Array}                  Array containing the arguments for hash creation.
 */
function hash(healthFacility, facilityTypeEnum, openingHoursEnum, facilityServices) {
  return [
    'id',
    healthFacility.id,
    'name',
    healthFacility.name,
    'businessName',
    healthFacility.businessName,
    'address.street',
    healthFacility.address.street,
    'address.number',
    healthFacility.address.number,
    'address.neighborhood',
    healthFacility.address.neighborhood,
    'address.postalCode',
    healthFacility.address.postalCode,
    'address.city',
    healthFacility.address.city,
    'address.state',
    healthFacility.address.state,
    'address.latitude',
    healthFacility.latitude,
    'address.longitude',
    healthFacility.longitude,
    'type',
    facilityTypeEnum.id,
    'phone',
    healthFacility.phone,
    'openingHours',
    openingHoursEnum.id,
    'services',
    facilityServices.join(',')
  ]
}

module.exports = HealthFacilitiesService;
