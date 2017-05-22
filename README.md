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

## Data structure

Currently the process takes one minute and organizes the data into Redis keys as described below:

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
127.0.0.1:6379> ZRANGE facility_type_list 0 9
 1) "1:HOSPITAL/DIA - ISOLADO"
 2) "2:CENTRAL DE GESTAO EM SAUDE"
 3) "3:CLINICA/CENTRO DE ESPECIALIDADE"
 4) "4:HOSPITAL GERAL"
 5) "5:CENTRO DE ATENCAO PSICOSSOCIAL"
 6) "6:UNIDADE DE APOIO DIAGNOSE E TERAPIA (SADT ISOLADO)"
 7) "7:CONSULTORIO ISOLADO"
 8) "8:POSTO DE SAUDE"
 9) "9:UNIDADE MOVEL DE NIVEL PRE-HOSPITALAR NA AREA DE URGENCIA"
10) "10:CENTRO DE SAUDE/UNIDADE BASICA"
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
127.0.0.1:6379> GEORADIUS geo_facilities -43.244348 -22.933380 5 km COUNT 10
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
