# API

Add config/config.json with the content like below:

```
{
  "test": {
    "PORT": "8081",
    "MONGODB_URI": "mongodb://localhost:27017/server-db-test",
    "JWT_SECRET": "sdfksdlfjsu834osfu988sdf"
  },
  "development": {
    "PORT": "8080",
    "MONGODB_URI": "mongodb://localhost:27017/server-db",
    "JWT_SECRET": "sdf989sd8f80sd0f9890ds8f"
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
