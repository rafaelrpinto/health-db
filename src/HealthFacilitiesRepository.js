let redis = require("redis");
let bunyan = require("bunyan");
// logger setup
let log = bunyan.createLogger({name: "redis-logger"});

// https://www.npmjs.com/package/redis#rediscreateclient
let redisClient = redis.createClient();

// Redis error listener
redisClient.on("error", function(err) {
  log.error({err: err});
});

/**
 * Repository for health facilities and related data.
 */
class HealthFacilitiesRepository {}

/**
 * Saves an opening hours global definition.
 * @param  {Object} openingHours opening hours global definition
 */
HealthFacilitiesRepository.saveOpeningHours = async(openingHours) => {
  redisClient.zadd(['facility_opening_hours_list', openingHours.id, `${openingHours.id}:${openingHours.description}`]);
}

/**
 * Saves a health facility type global definition.
 * @param  {Object} type health facility type global definition.
 */
HealthFacilitiesRepository.saveFacilityType = async(type) => {
  redisClient.zadd(['facility_type_list', type.id, `${type.id}:${type.description}`]);
}

/**
 * Associates a city with a state.
 * @param  {String} city City name to be associated.
 * @param  {String} state State to be associated.
 */
HealthFacilitiesRepository.associateCityWithState = async(city, state) => {
  redisClient.sadd(`cities:${state}`, city);
}

/**
 * Saves a health facility service global definition.
 * @param  {Object} service health facility service global definition.
 */
HealthFacilitiesRepository.saveService = async(service) => {
  redisClient.zadd(['service_list', service.id, `${service.id}:${service.description}`]);
}

/**
 * Adds the health facility to searchable sorted sets.
 * @param  {Integer} facility health faciity to be associated with a service.
 * @param  {Integer} service  service tobe associated with a health facility.
 */
HealthFacilitiesRepository.associateFacilityWithService = async(facility, service) => {
  //associate with service per state
  redisClient.zadd([`service:${service.id}:${facility.address.state}`, facility.id, facility.id]);
  // and also per city to allow more accurate searching
  redisClient.zadd([`service:${service.id}:${facility.address.state}:${facility.address.city}`, facility.id, facility.id]);
}

/**
 * Stores a health facility.
 * @param  {Object} facility health facility to be stored.
 */
HealthFacilitiesRepository.saveFacility = async(facility) => {
  // stores the health facility as hash
  redisClient.hmset(`facility:${facility.id}`, [
    'id',
    facility.id,
    'name',
    facility.name,
    'businessName',
    facility.businessName,
    'address.street',
    facility.address.street,
    'address.number',
    facility.address.number,
    'address.neighborhood',
    facility.address.neighborhood,
    'address.postalCode',
    facility.address.postalCode,
    'address.city',
    facility.address.city,
    'address.state',
    facility.address.state,
    'address.latitude',
    facility.latitude,
    'address.longitude',
    facility.longitude,
    'type',
    facility.type,
    'phone',
    facility.phone,
    'openingHours',
    facility.openingHours,
    'services',
    facility.services
  ]);

  // adds the health facility to the geographic index
  redisClient.geoadd('geo_facilities', facility.longitude, facility.latitude, facility.id);
}

module.exports = HealthFacilitiesRepository;
