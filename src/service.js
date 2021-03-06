let redis = require('redis');
let bunyan = require('bunyan');
let Promise = require('bluebird');
// project dependencies
let EnumGenerator = require('./enum');

// async redis client
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

// We only accept hospitals, clinics, emergencies, etc.
const ignoredFacilityTypes = [
  'COOPERATIVA',
  'CENTRAL DE ',
  'TELESSAUDE',
  'VIGILANCIA',
  'N/A',
  'HOME CARE',
  'RESIDENCIAL',
  'PSICOSSOCIAL',
  'CONSULTORIO',
  'APOIO',
  'FARMACIA',
  'LABORATORIO',
  'PREVENCAO',
  'PARTO',
  'OFICINA ORTOPEDICA'
];

// logger setup
let log = bunyan.createLogger({name: 'redis-logger'});

/**
 * Generates the hahs argument for a facility.
 * @param  {Object} healthFacility   Facility to be stored.
 * @param  {Object} facilityTypeEnum Type of the facility.
 * @param  {Object} openingHoursEnum Opening hours of the facility.
 * @param  {Array} facilityServices Services provided by the facility.
 * @param  {Object} cityEnum Address city enum.
 * @return {Array}                  Array containing the arguments for hash creation.
 */
function hash(healthFacility, facilityTypeEnum, openingHoursEnum, facilityServices, cityEnum) {
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
    cityEnum.description,
    'address.city.id',
    cityEnum.id,
    'address.state',
    healthFacility.address.state,
    'latitude',
    healthFacility.latitude,
    'longitude',
    healthFacility.longitude,
    'type',
    facilityTypeEnum.id,
    'phone',
    healthFacility.phone,
    'openingHours',
    openingHoursEnum.id,
    'services',
    facilityServices.join(',')
  ];
}

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
    this.citiesEnumGenerator = new EnumGenerator();

    //controle vars
    this.rowCount = 0;
    this.ignored = 0;
    this.countSleeping = false;
    this.dbVersionSet = false;

    // More options on: https://www.npmjs.com/package/redis#rediscreateclient
    this.redisClient = redis.createClient();

    // Redis error listener
    this.redisClient.on('error', function(err) {
      log.error({err});
    });
  }

  /**
   * Ends the process.
   */
  end() {
    log.info(`Total facilities processed: ${this.rowCount}`);
    log.info(`Total facilities ignored: ${this.ignored}`);
    this.redisClient.quit();
    this.redisClient = null;
  }

  /**
   * Saves a health facility.
   * @param  {Object} healthFacility Facility to be saved.
   */
  saveFacility(healthFacility) {
    // checks if the facility type does not match any ignored type
    let isAccepted = ignoredFacilityTypes.every(ignored => (healthFacility.type.indexOf(ignored) === -1));

    if (!isAccepted) {
      this.ignored++;
      return Promise.resolve();
    }

    // generates enums
    let facilityTypeEnum = this.facilityTypeEnumGenerator.generate(healthFacility.type);
    let openingHoursEnum = this.openingHoursEnumGenerator.generate(healthFacility.openingHours);
    let cityEnum = this.citiesEnumGenerator.generate(healthFacility.address.city);

    // groups redis commands
    let multi = this.redisClient.batch();

    if (!this.dbVersionSet) {
      this.dbVersionSet = true;
      // save the db version to make client cache expiration smarter
      let version = new Date().getTime();

      multi.set('db_version', version);
      log.info(`Creating db version ${version}`);
    }

    // adds the opening hours to the domain set
    multi.zadd(['facility_opening_hours_list', openingHoursEnum.id, `${openingHoursEnum.id}:${openingHoursEnum.description}`]);
    // adds the facility type to the domain set
    multi.zadd(['facility_type_list', facilityTypeEnum.id, `${facilityTypeEnum.id}:${facilityTypeEnum.description}`]);
    // adds the city to our domain
    multi.zadd(`cities:${healthFacility.address.state}`, cityEnum.id, `${cityEnum.id}:${cityEnum.description}`);

    // array with ids of the services
    let facilityServices = [];

    // creates the services indexes
    healthFacility.services.forEach((service) => {
      // generates th enum
      let serviceEnum = this.servicesEnumGenerator.generate(service.trim());

      // adds the service to the domain set
      multi.zadd(['service_list', serviceEnum.id, `${serviceEnum.id}:${serviceEnum.description}`]);
      //associate with service per state
      multi.zadd([`service:${serviceEnum.id}:${healthFacility.address.state}`, healthFacility.id, healthFacility.id]);
      // and also per city to allow more accurate searching
      multi.zadd([`service:${serviceEnum.id}:${healthFacility.address.state}:${cityEnum.id}`, healthFacility.id, healthFacility.id]);

      //adds the numeric id to be associated with the hash later
      facilityServices.push(serviceEnum.id);
    });

    // stores the health facility as hash
    multi.hmset(`facility:${healthFacility.id}`, hash(healthFacility, facilityTypeEnum, openingHoursEnum, facilityServices, cityEnum));

    // adds the health facility to the geographic index
    multi.geoadd('geo_facilities', healthFacility.longitude, healthFacility.latitude, healthFacility.id);

    // debugs the row count
    this.rowCount++;
    if (!this.countSleeping) {
      this.countSleeping = true;
      let self = this;
      setTimeout(() => {
        if (self.redisClient) {
          self.countSleeping = false;
          log.info(`${this.rowCount} facilities processed and ${this.ignored} ignored so far...`);
        }
      }, 5000);
    }

    // executes all commands in the same request
    return multi.execAsync();
  }
}

module.exports = HealthFacilitiesService;
