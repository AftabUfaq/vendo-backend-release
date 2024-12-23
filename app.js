var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var createInitialUser = require("./initial-admin");
const cron = require('node-cron');

createInitialUser();
var indexRouter = require("./routes/index");
var indexTest = require("./routes/index_test");
const users = require("./routes/users");
const storyRoutes= require("./routes/Story");
const adminUsers = require("./routes/adminusers");
const staticContents = require("./routes/staticContent");
const providers = require("./routes/providers");
const howItWorks= require('./routes/howItworks')
const providers_test = require("./routes/providers_test");
const vouchers = require("./routes/vouchers");
const products = require("./routes/products");
const loyaltyCards = require("./routes/loyaltycards");
const loyaltyCardsMobile = require("./routes/loyaltycards.mobile");


const cleanCron = require("./cronJob");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "jade");

// allowing all servers as CORS
const corsOptions = {
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));
//app.use(serveStatic(path.join(__dirname, 'public')));
app.use("/files", express.static(process.env.FILE_PATH));



cron.schedule('* * * * * *', () => {
  cleanCron();
});


app.use("/", indexRouter);
app.use("/test", indexTest);
app.use("/users", users);
app.use("/providers", providers);
app.use("/admin", adminUsers);
app.use("/vouchers", vouchers);
app.use("/products", products);
app.use("/hiw", howItWorks);
app.use("/cards", loyaltyCards);
app.use("/api/stories", storyRoutes);
app.use('/providers_test',providers_test)
app.use("/cards_mobile",loyaltyCardsMobile)
app.use("/staticcontents", staticContents);
app.get("*", function (req, res) {
  res.status(404).end();
});


// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  console.log(err, "ERROR");
  res.render("error");
});

module.exports = app;

/* 

ab servverr latessst code
*/