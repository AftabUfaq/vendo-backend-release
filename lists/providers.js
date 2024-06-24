const mongoose = require("../database/mongoose");
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {});

const providerSchema = new Schema({
  providerName: { type: String, alias: "name" },
  address: { type: String, alias: "street" },
  number: { type: String },
  postcode: { type: String },
  place: { type: String },
  region: { type: String },
  branch: { type: String },
  telephone: { type: String },
  mobile: { type: String },
  qrCodes: [{ points: Number, code: String }],
  loyaltyCards: [{ type: Schema.Types.ObjectId, ref: "LoyaltyCard" }],
  _vouchers: [
    {
      type: Schema.ObjectId,
      ref: "Voucher",
    },
  ],

  _products: [
    {
      type: Schema.ObjectId,
      ref: "Product",
    },
  ],

  email: {
    type: String,
    unique: true,
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },

  domain: { type: String },
  category: {
    type: String,
  },

  password: {
    type: String,
  },

  openTime: {
    type: String,
  },
  closeTime: {
    type: String,
  },
  orderStartDay: {
    type: String,
  },
  orderEndDay: {
    type: String,
  },

  paypalMode: { type: Boolean },
  cashMode: { type: Boolean },

  paypalClientId: { type: String, default: null },
  paypalClientSecret: { type: String, default: null },

  deliveryCost: { type: String },
  minOrderCost: { type: String },

  deliveryCircle: { type: String },
  deliveryApproxTime: { type: String },

  description: { type: String },

  logo: {},

  companyPresentation: {},
  companyPresentationStartDay: {
    type: String,
  },
  companyPresentationEndDay: {
    type: String,
  },

  advertisement: {},
  advertisementStartDay: {
    type: String,
  },
  advertisementEndDay: {
    type: String,
  },

  flyer: {},
  flyerStartDay: {
    type: String,
  },
  flyerEndDay: {
    type: String,
  },

  jobAdvertisement: {},
  jobAdvertisementStartDay: {
    type: String,
  },
  jobAdvertisementEndDay: {
    type: String,
  },

  menu: {},
  menuStartDay: {
    type: String,
  },
  menuEndDay: {
    type: String,
  },

  info: {},
  infoStartDay: {
    type: String,
  },
  infoEndDay: {
    type: String,
  },

  event: {},
  eventStartDay: {
    type: String,
  },
  eventEndDay: {
    type: String,
  },

  advertisingVideo: {},
  advertisingVideoStartDay: {
    type: String,
  },
  advertisingVideoEndDay: {
    type: String,
  },

  availability: { type: Boolean },
  deactivate: { type: Boolean, default: false },
  iswelcome: { type: Boolean, default: false },
  community: { type: String },
  Imprint: { type: String },
  subject_line: { type: String, default: null },
  input_text: { type: String, default: null },
  post_start_date: { type: String, default: null },
  post_end_date: { type: String, default: null },
  picture_1: {},
  picture_2: {},
  feed_show_status: { type: Boolean, default: false },
  like_count: { type: Number, default: 0 },
  wishlist_count: { type: Number, default: 0 },
  PRFeedData: [
    {
      subject_line: { type: String, default: null },
      input_text: { type: String, default: null },
      picture_1: {},
      picture_2: {},
      feed_show_status: { type: Boolean, default: false },
      post_start_date: { type: String, default: "" },
      post_end_date: { type: String, default: "" },
      like_count: { type: Number, default: 0 },
      wishlist_count: { type: Number, default: 0 },
      update_time: { type: String, default: null },
    },
  ],
  company_presentation_subject_line: { type: String, default: null },
  company_presentation_input_text: { type: String, default: null },
  company_presentation_picture_1: {},
  company_presentation_picture_2: {},
  company_presentation_feed_show_status: { type: Boolean, default: false },
  job_advertisement_subject_line: { type: String, default: null },
  job_advertisement_input_text: { type: String, default: null },
  job_advertisement_picture_1: {},
  job_advertisement_picture_2: {},
  job_advertisement_feed_show_status: { type: Boolean, default: false },
  flyer_subject_line: { type: String, default: null },
  flyer_input_text: { type: String, default: null },
  flyer_picture_1: {},
  flyer_picture_2: {},
  flyer_feed_show_status: { type: Boolean, default: false },
  advertisement_subject_line: { type: String, default: null },
  advertisement_input_text: { type: String, default: null },
  advertisement_picture_1: {},
  advertisement_picture_2: {},
  advertisement_feed_show_status: { type: Boolean, default: false },
  menu_subject_line: { type: String, default: null },
  menu_input_text: { type: String, default: null },
  menu_picture_1: {},
  menu_picture_2: {},
  menu_feed_show_status: { type: Boolean, default: false },
  info_subject_line: { type: String, default: null },
  info_input_text: { type: String, default: null },
  info_picture_1: {},
  info_picture_2: {},
  info_feed_show_status: { type: Boolean, default: false },
  event_subject_line: { type: String, default: null },
  event_input_text: { type: String, default: null },
  event_picture_1: {},
  event_picture_2: {},
  event_feed_show_status: { type: Boolean, default: false },
  advertising_video_subject_line: { type: String, default: null },
  advertising_video_input_text: { type: String, default: null },
  advertising_video_picture_1: {},
  advertising_video_picture_2: {},
  advertising_video_feed_show_status: { type: Boolean, default: false },
  companyWelcomeStartDay: { type: String, default: null },
  companyWelcomeEndDay: { type: String, default: null },
  jobAdvertisementWelcomeStartDay: { type: String, default: null },
  jobAdvertisementWelcomeEndDay: { type: String, default: null },
  flyerWelcomeStartDay: { type: String, default: null },
  flyerWelcomeEndDay: { type: String, default: null },
  advertisementWelcomeStartDay: { type: String, default: null },
  advertisementWelcomeEndDay: { type: String, default: null },
  menuWelcomeStartDay: { type: String, default: null },
  menuWelcomeEndDay: { type: String, default: null },
  infoWelcomeStartDay: { type: String, default: null },
  infoWelcomeEndDay: { type: String, default: null },
  eventWelcomeStartDay: { type: String, default: null },
  eventWelcomeEndDay: { type: String, default: null },
  advertisingVideoWelcomeStartDay: { type: String, default: null },
  advertisingVideoWelcomeEndDay: { type: String, default: null },

  // feed_like_count: { type: Number, default: 0 },
  // feed_wishlist_count: { type: Number, default: 0 },
  company_presentation_like_count: { type: Number, default: 0 },
  company_presentation_wishlist_count: { type: Number, default: 0 },
  job_advertisement_like_count: { type: Number, default: 0 },
  job_advertisement_wishlist_count: { type: Number, default: 0 },
  flyer_like_count: { type: Number, default: 0 },
  flyer_wishlist_count: { type: Number, default: 0 },
  advertisement_like_count: { type: Number, default: 0 },
  advertisement_wishlist_count: { type: Number, default: 0 },
  menu_like_count: { type: Number, default: 0 },
  menu_wishlist_count: { type: Number, default: 0 },
  info_like_count: { type: Number, default: 0 },
  info_wishlist_count: { type: Number, default: 0 },
  event_like_count: { type: Number, default: 0 },
  event_wishlist_count: { type: Number, default: 0 },
  advertising_video_like_count: { type: Number, default: 0 },
  advertising_video_wishlist_count: { type: Number, default: 0 },
  // update_time:{type:String,default:null},

  company_presentation_update_time: { type: String, default: null },
  job_advertisement_update_time: { type: String, default: null },
  flyer_update_time: { type: String, default: null },
  advertisement_update_time: { type: String, default: null },
  menu_update_time: { type: String, default: null },
  info_update_time: { type: String, default: null },
  event_update_time: { type: String, default: null },
  advertising_video_update_time: { type: String, default: null },

  companyPresentationpdf: {},
  jobAdvertisementpdf: {},
  flyerpdf: {},
  advertisementpdf: {},
  menupdf: {},
  infopdf: {},
  eventpdf: {},
  Abholung: { type: Boolean, default: false },
  Lieferung: { type: Boolean, default: false },
});

const Provider = mongoose.mongoose.model("Provider", providerSchema);

module.exports = Provider;
