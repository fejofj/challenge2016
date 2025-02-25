## API Documentation

Challenge2016 is built using Node.js & Moleculer.js as Node.js framework

I have developed Restful APIs for this challenge.

To Run this program first install Node.js

```
https://nodejs.org/en/download
```
After installing Node.js run this command

```npm install```

```npm run dev```

open this open api link in browser

```
http://localhost:3000/api/openapi/ui#/
```

APIs under ```v1.film``` used for film CURD operation

For ease of test I have added a film use ```GET``` ```/api/v1/film``` for list films

```GET``` ```/api/v1/distribution``` for getting list of distributors

> **_NOTE:_** use ```id``` field of film and distributor for authorize distribution and check permission

> **_NOTE:_** ```/api/v1/distribution/authorize-distribution``` to authorize api, ``include`` and ``exclude`` field supports array i.e You can add multiple regions at once
> ``update`` & ``delete`` is not developed  

## Thanks for the opportunity

```Febin K Joseph : febinjoseph63@gmail.com```
