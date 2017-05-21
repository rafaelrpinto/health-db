let redis = require("redis");
let bunyan = require("bunyan");

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
HealthFacilitiesRepository.saveOpeningHours = (openingHours) => {
  redisClient.sadd('facility_opening_hours_list', `${openingHours.id}:${openingHours.description}`);
}

/**
 * Saves a health facility type global definition.
 * @param  {Object} type health facility type global definition.
 */
HealthFacilitiesRepository.saveFacilityType = (type) => {
  redisClient.sadd('facility_type_list', `${type.id}:${type.description}`);
}

/**
 * Saves a health facility service global definition.
 * @param  {Object} service health facility service global definition.
 */
HealthFacilitiesRepository.saveService = (service) => {
  redisClient.sadd('service_list', `${service.id}:${service.description}`);
}

/**
 * Adds the health facility to the service index.
 * @param  {Integer} facilityId ID of the health faciity.
 * @param  {Integer} serviceId  ID of the service.
 */
HealthFacilitiesRepository.associateFacilityWithService = (facilityId, serviceId) => {
  redisClient.sadd(`service:${serviceId}`, facilityId);
}

/**
 * Stores a health facility.
 * @param  {Object} facility health facility to be stored.
 */
HealthFacilitiesRepository.saveFacility = (facility) => {
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
    facility.services,
    'communityPharmacy',
    facility.communityPharmacy
  ]);

  // adds the health facility to the geographic index
  redisClient.geoadd('geo_facilities', facility.longitude, facility.latitude, facility.id);
}

module.exports = HealthFacilitiesRepository;
