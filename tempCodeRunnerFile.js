const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();
require("./db"); // connecting to mongoDB
const Review = require("./models/reviews");
const Organization = require("./models/organizations");
const User = require("./models/users");