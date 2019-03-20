# API

Add config/config.json with the content like below:

```
{
  "test": {
    "PORT": "8081",
    "MONGODB_URI": "mongodb://localhost:27017/server-db-test",
    "JWT_SECRET": "sd9d9sd88sdd9s898sd89ds89",
    "SENDGRID_USERNAME": "sg-username",
    "SENDGRID_PASSWORD": "sg-password"
  },
  "development": {
    "PORT": "8080",
    "MONGODB_URI": "mongodb://localhost:27017/server-db",
    "JWT_SECRET": "ds99s9ds9s9sd09ds90sd9d09",
    "SENDGRID_USERNAME": "sg-username",
    "SENDGRID_PASSWORD": "sg-password"
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
MONGODB_URI=<production mongodb uri>
JWT_SECRET=<production jwt secret>
NODE_ENV=production
```

example:

```
MONGODB_URI=mongodb://localhost:27017/tas-db
JWT_SECRET=123ksdjf90u90sdf09sidf
NODE_ENV=production
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
