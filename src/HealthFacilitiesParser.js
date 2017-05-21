let fs = require('fs');
let csv = require('fast-csv');
// project dependencies
let HealthFacilitiesService = require('./HealthFacilitiesService')

/**
 * Class that parses a file containing health facilities.
 */
class HealthFacilitiesParser {

  /**
   * Constructor.
   * @param  {String} targetFile Path to the target CSV file.
   */
  constructor(targetFile) {
    this.targetFile = targetFile;
  }

  /**
   * Parses the file.
   * @return {Promise} A promise to resolve the file parsing.
   */
  parse() {
    let self = this;
    return new Promise(function(resolve, reject) {
      // creates a service instance to store the facilities
      let service = new HealthFacilitiesService();

      // Reads the file
      let stream = fs.createReadStream(self.targetFile);

      // CSV parsing options
      let parsingOptions = {
        headers: true,
        delimiter: ',',
        quote: '"',
        objectMode: true,
        trim: true
      };

      // parses the CSV file
      let csvStream = csv(parsingOptions).on("data", function(data) {
        // transforms the data structure
        let healthFacility = {
          id: data.co_cnes,
          ibge: data.co_ibge,
          type: val(data.ds_tipo_unidade),
          openingHours: val(data.ds_turno_atendimento),
          services: val(data.ds_servico_especializado),
          communityPharmacy: '0',
          name: val(data.no_fantasia),
          businessName: val(data.no_razao_social),
          phone: val(data.nu_telefone),
          latitude: data.lat,
          longitude: data.long,
          address: {
            street: val(data.no_logradouro),
            number: val(data.nu_endereco),
            neighborhood: val(data.no_bairro),
            postalCode: val(data.co_cep),
            state: val(data.uf),
            city: val(data.municipio)
          }
        };

        // stores the facility
        service.saveFacility(healthFacility).catch(reject);

      }).on("end", function() {
        // resolves the promise
        resolve();
      });

      stream.pipe(csvStream);
    });
  }
}

/**
 * Defines the value as N/A if it's absent.
 */
function val(value) {
  if (!value) {
    return "N/A";
  }
  return value;
}

module.exports = HealthFacilitiesParser;