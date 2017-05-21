// project dependencies
let EnumGenerator = require('./EnumGenerator')
let repository = require('./HealthFacilitiesRepository')

/**
 * Service responsible for operations related to health facilities.
 */
class HealthFacilitiesService {

  /**
   * Constructor.
   */
  constructor() {
    // initiate the internal id generators
    this.facilityTypeEnumGenerator = new EnumGenerator();
    this.openingHoursEnumGenerator = new EnumGenerator();
    this.servicesEnumGenerator = new EnumGenerator();
  }

  /**
   * Saves a health facility.
   * @param  {Object} healthFacility Facility to be saved.
   */
  async saveFacility(healthFacility) {
    let facilityTypeEnum = this.facilityTypeEnumGenerator.generate(healthFacility.type);
    let openingHoursEnum = this.openingHoursEnumGenerator.generate(healthFacility.openingHours);

    await Promise.all([
      // adds the facility type to the domain set
      repository.saveFacilityType(facilityTypeEnum),
      // adds the opening hours to the domain set
      repository.saveOpeningHours(openingHoursEnum)
    ]);

    // array with ids of the services
    let facilityServices = [];

    // creates the services indexes
    for (let service of healthFacility.services.split("|")) {
      let serviceName = service.trim();
      let serviceEnum = this.servicesEnumGenerator.generate(serviceName);

      await Promise.all([
        // adds the service to the domain set
        repository.saveService(serviceEnum),
        //adds this facility to the service index
        repository.associateFacilityWithService(healthFacility.id, serviceEnum.id)
      ]);

      //adds the numeric id to be associated with the hash later
      facilityServices.push(serviceEnum.id);
    }

    // we replace the long strings by the generated enum ids to improve performance
    let facilityToBeSaved = Object.assign(healthFacility, {
      type: facilityTypeEnum.id,
      openingHours: openingHoursEnum.id,
      services: facilityServices.join(',')
    });

    // saves the facility
    return repository.saveFacility(facilityToBeSaved);
  }
}

module.exports = HealthFacilitiesService;
