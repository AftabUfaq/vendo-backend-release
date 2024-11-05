const VoucherModel = require('./lists/vouchers')
const ProductModel = require("./lists/products");

const db = require("./database/mongooseCrud");

const cleanCron= async () => {
    let products=  await db.getPopulatedData(ProductModel, {}, [{path: "_provider", select: "region"}])

    let productsWithNullProvider= products.data.filter((i)=> i._provider==null);

    if(productsWithNullProvider.length > 0){
      productsWithNullProvider.forEach( async(p)=>{
        try{
        //   await db.deleteOne(ProductModel, {_id: p._id})

          //console.log(`Empty Products count: ${productsWithNullProvider.length}`)
        }catch(err){
            console.log("Error deleting products: ", err)
        }
      })
    }

    // delete vouchers with empty relations

    let vouchers=  await db.getPopulatedData(VoucherModel, {}, [{path: "_provider", select: "region"}])

    let vouchersWithNullProvider= vouchers.data.filter((i)=> i._provider==null);

    if(vouchersWithNullProvider.length > 0){
      vouchersWithNullProvider.forEach( async(v)=>{
        try{
        //   await db.deleteOne(VoucherModel, {_id: v._id})

          console.log(`Empty Vouchers count: ${vouchersWithNullProvider.length}`)
        }catch(err){
            console.log("Error deleting vouchers: ", err)
        }
      })
    }
}



module.exports = cleanCron