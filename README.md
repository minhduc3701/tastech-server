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
    "SENDGRID_USERNAME": "sg-username",
    "SENDGRID_PASSWORD": "sg-password",
    "APP_URI": "http://localhost:3000",
    "AWS_ACCESS_KEY_ID": <AWS_ACCESS_KEY_ID>,
    "AWS_SECRET_ACCESS_KEY": <AWS_SECRET_ACCESS_KEY>,
    "AWS_S3_NAME="eztrip-dev",
    "AWS_S3_REGION": "us-east-2",
    "AWS_S3_URI": "https://eztrip-dev.s3.ap-southeast-1.amazonaws.com",
    "PKFARE_URI": "https://open.pkfare.com/apitest",
    "PKFARE_HOTEL_URI": "http://testhotelapi.pkfare.com",
    "PKFARE_PARTNER_ID": <PKFARE_PARTNER_ID>,
    "PKFARE_SIGN": <PKFARE_SIGN>
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
export SENDGRID_USERNAME=<production sendgrid username>
export SENDGRID_PASSWORD=<production sendgrid username>
export APP_URI=<frontend app uri>
export AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
export AWS_S3_NAME=<AWS_S3_NAME>
export AWS_S3_REGION=<AWS_S3_REGION>
export AWS_S3_URI=<S3_URI>
export PKFARE_URI=https://pending.com
export PKFARE_PARTNER_ID=<PKFARE_PARTNER_ID>
export PKFARE_SIGN=<PKFARE_SIGN>
```

Now you ready to run your app

Read more at: http://mrngoitall.net/blog/2013/10/13/best-practices-on-deploying-node-dot-js-to-aws-ec2/
