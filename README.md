## Overview
Node.js project that builds a Redis database of Brazilian health facilities based on government provided CSV files (Dados Abertos).

By using Redis as our database we can take advantage of it's speed to create cost-effective apis / apps that can be accessed by a large number of clients requiring as few resources as possible. See more in [How fast is redis?](https://redis.io/topics/benchmarks)

The raw data used as input is available on the Brazilian Government's [open data site](http://dados.gov.br/dataset/cnes_ativo).

An example of api server that accesses this db can be found [here](https://github.com/rafaelrpinto/health-api).

Still on initial stages, don't mind the mess.

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
127.0.0.1:6379> SMEMBERS cities:RJ
1) "CARAPEBUS"
2) "PARAIBA DO SUL"
3) "SAO JOSE DO VALE DO RIO PRETO"
4) "PETROPOLIS"
5) "SANTA MARIA MADALENA"
6) "ITABORAI"
7) "MACAE"
8) "ARMACAO DOS BUZIOS"
9) "SAO SEBASTIAO DO ALTO"
10) "CANTAGALO"
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

- service:{serviceId}:{state}:{city}

This key holds a set of facilities that offer the service identified by 'serviceId', state and city.

```shell
127.0.0.1:6379> ZRANGE "service:1:RJ:RIO DE JANEIRO" 0 9
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
13) "address.postalCode"
14) "56506460"
15) "address.city"
16) "ARCOVERDE"
17) "address.state"
18) "PE"
19) "address.latitude"
20) "-8.4180273"
21) "address.longitude"
22) "-37.0532275"
23) "type"
24) "10"
25) "phone"
26) "87 38219010"
27) "openingHours"
28) "2"
29) "services"
30) "9,15,60,27,21"
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
