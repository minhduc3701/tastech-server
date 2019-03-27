# API

Add config/config.json with the content like below:

```
{
  "test": {
    "PORT": "8081",
    "MONGODB_URI": "mongodb://localhost:27017/server-db-test",
    "JWT_SECRET": "sd9d9sd88sdd9s898sd89ds89",
    "SENDGRID_USERNAME": "sg-username",
    "SENDGRID_PASSWORD": "sg-password",
    "APP_URI": "http://localhost:3000"
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
    "AWS_S3_BUCKET_URI": "https://eztrip-dev.s3.ap-southeast-1.amazonaws.com"
  }
}

```

## Installation

```
yarn
```

## Start server

```
DEBUG=tas-server-app:* yarn start
```

Open http://locahost:8080

### Start server with other port

```
PORT=8888 yarn start
```

## Deployment on ec2

Create `prod.env` in home directory with the content

```
export MONGODB_URI=<production mongodb uri>
export JWT_SECRET=<production jwt secret>
export NODE_ENV=production
export SENDGRID_USERNAME=<production sendgrid username>
export SENDGRID_PASSWORD=<production sendgrid username>
export APP_URI=<frontend app uri>
```

example:

```
export MONGODB_URI=mongodb://localhost:27017/tas-db
export JWT_SECRET=123ksdjf90u90sdf09sidf
export NODE_ENV=production
export SENDGRID_USERNAME=johndoe
export SENDGRID_PASSWORD=johndoe_password
export APP_URI=eztrip.com
```

Add the line in your `~/.bashrc`

```
source /home/ubuntu/prod.env
```

After that run:

```
source ~/.bashrc
```

Now you ready to run your app

Read more at: http://mrngoitall.net/blog/2013/10/13/best-practices-on-deploying-node-dot-js-to-aws-ec2/
