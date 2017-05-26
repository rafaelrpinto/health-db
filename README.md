## Overview
Node.js project that builds a Redis database of Brazilian health facilities based on government provided CSV files (Dados Abertos).

By using Redis as our database we can take advantage of it's speed to create cost-effective apis / apps that can be accessed by a large number of clients requiring as few resources as possible. See more in [How fast is redis?](https://redis.io/topics/benchmarks)

The raw data used as input is available on the Brazilian Government's [open data site](http://dados.gov.br/dataset/cnes_ativo).

An api server that accesses this db can be found [here](https://github.com/rafaelrpinto/health-api).

## Bulding the database

The application connects to a local Redis instance running on 127.0.0.1:6379. (`TODO: make the it configurable`)

Extract the .gz file located on the files folder. The correct structure should be:

- files/cnes.csv
- files/cnes.small.csv

To create a db with a small dataset run:

`npm run small`

To create the db with the full dataset run:

`npm run full`

## Ignored facilities

To improve performance and avoid maps full of markers we only map hospitals, clinics, mobile units, etc.

## Expected output:

```shell
18:37:41.927Z  INFO app-logger: Initiating process.
18:37:41.959Z  INFO redis-logger: Creating db version 1495823861959
18:37:46.963Z  INFO redis-logger: 20920 facilities processed and 14339 ignored so far...
18:37:51.968Z  INFO redis-logger: 42725 facilities processed and 29229 ignored so far...
18:37:56.971Z  INFO redis-logger: 62868 facilities processed and 43200 ignored so far...
18:38:01.981Z  INFO redis-logger: 82777 facilities processed and 57188 ignored so far...
18:38:06.986Z  INFO redis-logger: 91242 facilities processed and 104524 ignored so far...
18:38:12.004Z  INFO redis-logger: 98254 facilities processed and 148517 ignored so far...
18:38:13.938Z  INFO redis-logger: Total facilities processed: 100663
18:38:13.938Z  INFO redis-logger: Total facilities ignored: 164117
18:38:13.939Z  INFO app-logger: Process complete.
```

Memory used by Redis after the db creation: `105.93M`

## Data structure

Currently the process takes one minute and organizes the data into Redis keys as described below:

- db_version

This key holds the version of the database data. Clients should use this value to decide if their cache is stale.

```shell
127.0.0.1:6379> GET db_version
"1495712237519"
```

- facility_opening_hours_list

This key holds the set of possible opening hours definitions for the health facilities.

```shell
127.0.0.1:6379> ZRANGE facility_opening_hours_list 0 9
1) "1:ATENDIMENTO COM TURNOS INTERMITENTES"
2) "2:ATENDIMENTOS NOS TURNOS DA MANHA E A TARDE"
3) "3:ATENDIMENTO NOS TURNOS DA MANHA, TARDE E NOITE"
4) "4:ATENDIMENTO CONTINUO DE 24 HORAS/DIA (PLANTAO:INCLUI SABADOS, DOMINGOS E FERIADOS)"
5) "5:ATENDIMENTO SOMENTE A NOITE"
6) "6:ATENDIMENTO SOMENTE PELA MANHA"
7) "7:ATENDIMENTO SOMENTE A TARDE"
8) "8:N/A"
```
-  facility_type_list

This key holds the set of possible facility types definitions for the health facilities.

```shell
127.0.0.1:6379> ZRANGE facility_type_list 0 20
 1) "1:HOSPITAL/DIA - ISOLADO"
 2) "2:CLINICA/CENTRO DE ESPECIALIDADE"
 3) "3:HOSPITAL GERAL"
 4) "4:POSTO DE SAUDE"
 5) "5:UNIDADE MOVEL DE NIVEL PRE-HOSPITALAR NA AREA DE URGENCIA"
 6) "6:CENTRO DE SAUDE/UNIDADE BASICA"
 7) "7:PRONTO ATENDIMENTO"
 8) "8:HOSPITAL ESPECIALIZADO"
 9) "9:PRONTO SOCORRO GERAL"
10) "10:POLICLINICA"
11) "11:UNIDADE MOVEL FLUVIAL"
12) "12:UNIDADE MISTA"
13) "13:POLO ACADEMIA DA SAUDE"
14) "14:CENTRO DE ATENCAO HEMOTERAPIA E OU HEMATOLOGICA"
15) "15:UNIDADE DE ATENCAO A SAUDE INDIGENA"
16) "16:UNIDADE MOVEL TERRESTRE"
17) "17:PRONTO SOCORRO ESPECIALIZADO"
```

- service_list

This key holds the set of possible services offered by the health facilities.

```shell
127.0.0.1:6379> ZRANGE service_list 0 9
 1) "1:SERVICO DE VIDEOLAPAROSCOPIA"
 2) "2:SERVICO DE DIAGNOSTICO POR IMAGEM"
 3) "3:SERVICO DE DIAGNOSTICO POR ANATOMIA PATOLOGICA EOU CITOPATO"
 4) "4:HOSPITAL DIA"
 5) "5:SERVICO DE VIGILANCIA EM SAUDE"
 6) "6:SERVICO DE DISPENSACAO DE ORTESES PROTESES E MATERIAIS ESPE"
 7) "7:MEDICINA NUCLEAR"
 8) "8:SERVICO DE DIAGNOSTICO POR METODOS GRAFICOS DINAMICOS"
 9) "9:SERVICO DE ATENCAO AO PRE-NATAL, PARTO E NASCIMENTO"
10) "10:SERVICO DE FISIOTERAPIA"
```

- cities:{state}

This key holds the set of cities of a specific state.

```shell
127.0.0.1:6379> ZRANGE cities:RJ 0 9
 1) "37:CANTAGALO"
 2) "42:RIO DE JANEIRO"
 3) "59:VALENCA"
 4) "61:NITEROI"
 5) "81:VOLTA REDONDA"
 6) "93:MANGARATIBA"
 7) "114:AREAL"
 8) "129:SAO GONCALO"
 9) "153:CAMPOS DOS GOYTACAZES"
10) "166:MESQUITA"
```

- service:{serviceId}:{state}

This key holds a set of facilities that offer the service identified by 'serviceId' and a state.

```shell
127.0.0.1:6379> ZRANGE service:1:RJ 0 9
 1) "12505"
 2) "12548"
 3) "12556"
 4) "12599"
 5) "25135"
 6) "25143"
 7) "25186"
 8) "26050"
 9) "2267187"
10) "2267209"
```

- service:{serviceId}:{state}:{cityId}

This key holds a set of facilities that offer the service identified by 'serviceId', state and city id.

```shell
127.0.0.1:6379> ZRANGE "service:1:RJ:42" 0 9
 1) "2269384"
 2) "2269481"
 3) "2269775"
 4) "2269783"
 5) "2269821"
 6) "2269880"
 7) "2269945"
 8) "2269988"
 9) "2270021"
10) "2270234"
```

- facility:{facilityId}

This key holds the hash with the details of the facility identified by 'facilityId'.


```shell
127.0.0.1:6379> HGETALL facility:5740576
 1) "id"
 2) "5740576"
 3) "name"
 4) "UBSF VILA SAO JOSE SAO GERALDO"
 5) "businessName"
 6) "FUNDO MUNICIPAL DE SAUDE DE ARCOVERDE"
 7) "address.street"
 8) "AVENIDA DOM PEDRO II"
 9) "address.number"
10) "S/N"
11) "address.neighborhood"
12) "SAO GERALDO"
15) "address.postalCode"
16) "56506460"
17) "address.city"
18) "ARCOVERDE"
19) "address.city.id"
20) "83"
21) "address.state"
22) "PE"
23) "address.latitude"
24) "-8.4180273"
25) "address.longitude"
26) "-37.0532275"
27) "type"
28) "10"
29) "phone"
30) "87 38219010"
31) "openingHours"
32) "3"
33) "services"
34) "18,27,60,38,23"
```

- geo_facilities

This key indexes all the facilities by it's coordinates allowing geospatial queries. Ex: we are looking for 10 facilities within 5 km radius of a neighborhood in Rio de Janeiro:

```shell
127.0.0.1:6379> GEORADIUS geo_facilities -43.244348 -22.933380 5 km COUNT 10 ASC
1) "5671388"
2) "7383304"
3) "7737505"
4) "5188024"
5) "3052664"
6) "3603016"
7) "5188032"
8) "5359686"
9) "5701988"
10) "7379676"

```
