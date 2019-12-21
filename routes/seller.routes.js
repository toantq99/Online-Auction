const express = require("express");

const productModel = require("../models/product.model");
const upload = require("../middlewares/upload.mdw");
const fs = require('fs-extra')
const router = express.Router();
const uuid = require('uuid/v1');
const checkUser = require("../middlewares/user.mdw");

router.get("/new-product", checkUser.checkSeller, async (req, res, next) => {
    res.render("vwSeller/new-product", {
        user: req.user,
        title: "Mở phiên đấu giá",
        id: uuid(),
    });

    req.session.lastUrl = req.originalUrl;
});

var filesConfig = [{
    name: 'fileMain',
    maxCount: 1
}, {
    name: 'filesThumb[]'
}];
router.post("/new-product/", upload.fields(filesConfig), checkUser.checkAuthenticatedPost, async (req, res, next) => {
    const entityProductSingle = {
        productID: req.body.id,
        productName: req.body.productName,
        seller: req.user.userID,
        brand: req.body.brand,
        pFrom: req.body.pFrom,
        beginPrice: req.body.beginPrice,
        currentPrice: req.body.beginPrice,
        stepPrice: req.body.stepPrice,
        immePrice: req.body.immePrice,
        description: req.body.description,
        beginDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        autoExtend: req.body.autoExtend === "on",
    }

    await productModel.addProductSingle(entityProductSingle);

    const mainImg = req.files.fileMain;
    let entityProductImg = {
        productID: req.body.id,
        imgSrc: mainImg[0].filename,
        isMain: 1,
    }
    await productModel.addProductImg(entityProductImg);
    for (const file of req.files['filesThumb[]']) {
        entityProductImg = {
            productID: req.body.id,
            imgSrc: file.filename,
        }
        await productModel.addProductImg(entityProductImg);
    }

    res.redirect(`/product/${req.body.id}`);
});

router.post("/product/:productID/delete", async (req, res) => {
    const rows = await productModel.single(req.params.productID);
    const product = rows[0];
    if (product.seller === req.user.userID) {
        await productModel.deleteProduct(req.params.productID);

        const dir = `./public/img/product/${req.params.productID}`;
        fs.exists(dir, exist => {
            if (exist) {
                fs.remove(dir, (error) => {
                    if (error) console.log(error.message);
                })
            }
        })

    }
    res.send(req.params.productID);
});

module.exports = router;