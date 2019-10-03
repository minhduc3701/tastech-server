# API

Add config/config.json with the content like below:

```
{
  "test": {
    ...<test config like development>
  },
  "development": {
    "PORT": "8080",
    "MONGODB_URI": "mongodb://localhost:27017/server-db",
    "JWT_SECRET": "ds99s9ds9s9sd09ds90sd9d09",
    "APP_URI": "http://localhost:3000",
    "ALLOW_ORIGIN": "http://localhost:3000",
    "AWS_ACCESS_KEY_ID": <AWS_ACCESS_KEY_ID>,
    "AWS_SECRET_ACCESS_KEY": <AWS_SECRET_ACCESS_KEY>,
    "AWS_S3_NAME="eztrip-dev",
    "AWS_S3_REGION": "us-east-2",
    "AWS_S3_URI": "https://eztrip-dev.s3.ap-southeast-1.amazonaws.com",
    "PKFARE_URI": "https://open.pkfare.com/apitest",
    "PKFARE_HOTEL_URI": "https://hotelapi.pkfare.com/hotel",
    "PKFARE_PARTNER_ID": <PKFARE_PARTNER_ID>,
    "PKFARE_PARTNER_KEY": <PKFARE_PARTNER_KEY>,
    "PKFARE_HOTEL_ORDER_SECRET": <dev.ezbiztrip or local.thanh>,
    "SABRE_URI":"https://api-crt.cert.havail.sabre.com",
    "SABRE_USER_ID":"<SABRE_USER_ID>",
    "SABRE_CLIENT_ID":"<SABRE_CLIENT_ID>",
    "SABRE_SECRET_KEY":"<SABRE_SECRET_KEY>",
    "SABRE_BASE_CURRENCY": "SGD",
    "SABRE_GIAMSO_CODE": "SABRE_GIAMSO_CODE",
    "STRIPE_SECRET_KEY": <STRIPE_SECRET_KEY>,
    "BASE_CURRENCY": "USD",
    "HOTELBEDS_BASE_CURRENCY": "EUR",
    "HOTELBEDS_URI": "https://api.test.hotelbeds.com",
    "HOTELBEDS_CONTENT_VERSION": "1.0",
    "HOTELBEDS_BOOKING_VERSION": "1.2",
    "HOTELBEDS_HOTEL_KEY": <HOTELBEDS_KEY>,
    "HOTELBEDS_HOTEL_SECRET": <HOTELBEDS_SECRET>,
    "HOTELBEDS_TOLERANCE": "5",
    "TRANSFERWISE_URI": "https://api.sandbox.transferwise.tech",
    "TRANSFERWISE_API_KEY": "",
    "SMTP_HOST": "smtp.mailtrap.io",
    "SMTP_PORT": "2525",
    "SMTP_USER": "<your mailtrap user>",
    "SMTP_PASSWORD": "<your mailtrap password>",
    "EMAIL_CONTACT": "support@ezbiztrip.com",
    "EMAIL_NO_REPLY": "no-reply@ezbiztrip.com",
    "URBOX_ID": <UR_BOX_ID>,
    "URBOX_SECRET": <UR_BOX_SECRET>
    "URBOX_URI": "https://sandapi.urbox.vn",
    "URBOX_GIFTLIST_VERSION": "4.0",
    "URBOX_OTHER_API_VERSION": "2.0",
    "URBOX_EZBIZTRIP_NAME": "Ezbiztrip",
    "URBOX_EZBIZTRIP_PHONE": "84123456789",
    "URBOX_EZBIZTRIP_EMAIL": "urbox@ezbiztrip.com"
    "EMAIL_GIAMSO": ""
  }
}

```

## Installation

```
yarn
```

## Seed database

Seed test DB

```
yarn seed-test-db
```

Seed development DB

```
yarn seed-dev-db
```

or

```
yarn seed-db
```

Options:

Seed all collections:

```
yarn seed-db
```

Seed only `expenses` collection:

```
yarn seed-db -c expenses
yarn seed-db --collections expenses
```

Seed 2 collections or more:

```
yarn seed-db -c expenses departments
yarn seed-db --collections expenses departments
```

## Start server

```
yarn start
```

or with debug:

```
DEBUG=tas-server-app:* yarn start
```

Open http://locahost:8080

### Start server with other port

```
PORT=8888 yarn start
```

## Deployment for development

Create file `config/config.json` and fill dev credentials to it, see above section for file syntax

## Deployment on ec2

Create `prod.env` in home directory with the content

```
export MONGODB_URI=<production mongodb uri>
export JWT_SECRET=<production jwt secret>
export NODE_ENV=production
export SENDGRID_API_KEY=<sendgrid api key>
export APP_URI=<frontend app uri>
export ALLOW_ORIGIN=<frontend app uri>
export AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
export AWS_S3_NAME=<AWS_S3_NAME>
export AWS_S3_REGION=<AWS_S3_REGION>
export AWS_S3_URI=<S3_URI>
export PKFARE_URI=https://pending.com
export PKFARE_HOTEL_URI=https://hotelapi.pkfare.com/hotel
export PKFARE_PARTNER_ID=<PKFARE_PARTNER_ID>
export PKFARE_PARTNER_KEY=<PKFARE_PARTNER_KEY>
export PKFARE_HOTEL_ORDER_SECRET=<production hotel order secret>
export SABRE_URI=https://api-crt.cert.havail.sabre.com
export SABRE_USER_ID=<SABRE_USER_ID>
export SABRE_CLIENT_ID=<SABRE_CLIENT_ID>
export SABRE_SECRET_KEY=<SABRE_SECRET_KEY>
export SABRE_GIAMSO_CODE=<SABRE_GIAMSO_CODE>
export SABRE_BASE_CURRENCY=<SABRE_BASE_CURRENCY>
export STRIPE_SECRET_KEY=<STRIPE_SECRET_KEY>
export BASE_CURRENCY=SGD
export HOTELBEDS_BASE_CURRENCY=EUR
export HOTELBEDS_URI=https://api.test.hotelbeds.com
export HOTELBEDS_CONTENT_VERSION=1.0
export HOTELBEDS_BOOKING_VERSION=1.2
export HOTELBEDS_HOTEL_KEY=<HOTELBEDS_KEY>
export HOTELBEDS_HOTEL_SECRET=<HOTELBEDS_SECRET>
export HOTELBEDS_TOLERANCE=2
export TRANSFERWISE_URI=https://api.transferwise.com
export TRANSFERWISE_API_KEY=<TRANSFERWISE_LIVE_KEY>
export EMAIL_CONTACT=support@ezbiztrip.com
export EMAIL_NO_REPLY=no-reply@ezbiztrip.com
export URBOX_ID=<UR_BOX_ID>
export URBOX_SECRET=<UR_BOX_SECRET>
export URBOX_URI=https://sandapi.urbox.vn
export URBOX_GIFTLIST_VERSION=4.0
export URBOX_OTHER_API_VERSION=2.0
export URBOX_EZBIZTRIP_NAME=Ezbiztrip
export URBOX_EZBIZTRIP_PHONE=84123456789
export URBOX_EZBIZTRIP_EMAIL=urbox@ezbiztrip.com
export EMAIL_GIAMSO=<EMAIL_GIAMSO>
```

Now you ready to run your app

Read more at: http://mrngoitall.net/blog/2013/10/13/best-practices-on-deploying-node-dot-js-to-aws-ec2/
