# health-db
Node.js project that builds a Redis database of Brazilian health facilities based on government provided CSV files. Bt using redis we can take advantage of it's hability to scale and speed to create apis, apps, etc.

The project is still in it's initial stages. As it goes further I will add proper documentation and tests.

The data processed is available on the Brazilian Government's open data site: http://dados.gov.br/dataset/cnes_ativo

Currently the process takes one minute and organizes the data into Redis keys as described below:

### facility_opening_hours_list

This key holds the set of possible opening hours definitions for the health facilities.

```shell
127.0.0.1:6379> SMEMBERS facility_opening_hours_list
1) "4:ATENDIMENTO CONTINUO DE 24 HORAS/DIA (PLANTAO:INCLUI SABADOS, DOMINGOS E FERIADOS)"
2) "6:ATENDIMENTO SOMENTE PELA MANHA"
3) "7:ATENDIMENTO SOMENTE A TARDE"
4) "8:N/A"
5) "5:ATENDIMENTO SOMENTE A NOITE"
6) "3:ATENDIMENTO NOS TURNOS DA MANHA, TARDE E NOITE"
7) "2:ATENDIMENTOS NOS TURNOS DA MANHA E A TARDE"
8) "1:ATENDIMENTO COM TURNOS INTERMITENTES"
```
### facility_type_list

This key holds the set of possible facility types definitions for the health facilities.

```shell
127.0.0.1:6379> SMEMBERS facility_type_list
 1) "14:FARMACIA"
 2) "6:UNIDADE DE APOIO DIAGNOSE E TERAPIA (SADT ISOLADO)"
 3) "9:UNIDADE MOVEL DE NIVEL PRE-HOSPITALAR NA AREA DE URGENCIA"
 4) "35:CENTRO DE PARTO NORMAL - ISOLADO"
 5) "10:CENTRO DE SAUDE/UNIDADE BASICA"
 6) "26:TELESSAUDE"
 7) "20:SERVICO DE ATENCAO DOMICILIAR ISOLADO(HOME CARE)"
 8) "34:POLO DE PREVENCAO DE DOENCAS E AGRAVOS E PROMOCAO DA SAUDE"
 9) "2:CENTRAL DE GESTAO EM SAUDE"
10) "21:LABORATORIO DE SAUDE PUBLICA"
11) "11:PRONTO ATENDIMENTO"
12) "37:COOPERATIVA OU EMPRESA DE CESSAO DE TRABALHADORES NA SAUDE"
13) "25:POLO ACADEMIA DA SAUDE"
14) "12:HOSPITAL ESPECIALIZADO"
15) "5:CENTRO DE ATENCAO PSICOSSOCIAL"
16) "33:LABORATORIO CENTRAL DE SAUDE PUBLICA LACEN"
17) "22:UNIDADE MOVEL FLUVIAL"
18) "16:POLICLINICA"
19) "1:HOSPITAL/DIA - ISOLADO"
20) "17:UNIDADE DE ATENCAO EM REGIME RESIDENCIAL"
21) "8:POSTO DE SAUDE"
22) "3:CLINICA/CENTRO DE ESPECIALIDADE"
23) "19:UNIDADE DE VIGILANCIA EM SAUDE"
24) "32:PRONTO SOCORRO ESPECIALIZADO"
25) "18:CENTRAL DE REGULACAO DO ACESSO"
26) "23:UNIDADE MISTA"
27) "36:OFICINA ORTOPEDICA"
28) "7:CONSULTORIO ISOLADO"
29) "29:UNIDADE DE ATENCAO A SAUDE INDIGENA"
30) "27:CENTRAL DE REGULACAO MEDICA DAS URGENCIAS"
31) "30:UNIDADE MOVEL TERRESTRE"
32) "31:CENTRAL DE NOTIFICACAO,CAPTACAO E DISTRIB DE ORGAOS ESTADUAL"
33) "24:CENTRAL DE REGULACAO DE SERVICOS DE SAUDE"
34) "15:PRONTO SOCORRO GERAL"
35) "28:CENTRO DE ATENCAO HEMOTERAPIA E OU HEMATOLOGICA"
36) "13:CENTRO DE APOIO A SAUDE DA FAMILIA"
37) "4:HOSPITAL GERAL"
```

### service_list

This key holds the set of possible services offered by the health facilities.

```shell
127.0.0.1:6379> SMEMBERS service_list
 ...
25) "40:ATENCAO A SAUDE DA POPULACAO INDIGENA"
26) "30:SERVICO DE APOIO A SAUDE DA FAMILIA"
27) "45:SERVICO DE ORTESES, PROTESES E MAT ESPECIAIS EM REABILITACAO"
28) "28:REGULACAO DE ACESSO A ACOES E SERVICOS DE SAUDE"
29) "15:ESTRATEGIA DE SAUDE DA FAMILIA"
30) "38:ATENCAO A DOEN\xc3\x87A RENAL CRONICA"
31) "24:SERVICO DE ATENCAO DOMICILIAR"
32) "49:SERVICO DE SUPORTE NUTRICIONAL"
33) "63:SERV ANALISE LABORATORIAL DE PROD SUJEITOS A VIG SANITARIA"
34) "50:SERVICO DE TRIAGEM NEONATAL"
35) "9:SERVICO DE ATENCAO AO PRE-NATAL, PARTO E NASCIMENTO"
36) "5:SERVICO DE VIGILANCIA EM SAUDE"
37) "21:SERVICO DE CONTROLE DE TABAGISMO"
38) "48:SERVICO DE LABORATORIO DE HISTOCOMPATIBILIDADE"
39) "1:SERVICO DE VIDEOLAPAROSCOPIA"
40) "34:SERVICO DE LABORATORIO DE PROTESE DENTARIA"
...

```

### service:{serviceId}

This key holds a set of facilities that offer the service identified by 'serviceId'.

```shell
127.0.0.1:6379> SMEMBERS service:60
...
42) "5303907"
43) "5303966"
44) "5358965"
45) "5552869"
46) "5740576"
47) "5874882"
...
```

### facility:{facilityId}

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
16) "Arcoverde"
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

### geo_facilities

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
