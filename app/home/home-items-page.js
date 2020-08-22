const HomeItemsViewModel = require("./home-items-view-model");
var image = require("ui/image");

var plugin = require("nativescript-screenshot");
var BitmapFactory = require("nativescript-bitmap-factory");
const Color = require("tns-core-modules/color").Color;
const app = require("tns-core-modules/application");
const imageSourceModule = require("tns-core-modules/image-source");
const fileSystemModule = require("tns-core-modules/file-system");
const permissions = require("nativescript-permissions");
var imagepicker = require("nativescript-imagepicker");
const folder = fileSystemModule.knownFolders.currentApp();
//Main stack layout subtitute for Page
global.mainStack = "";
//ImageView element
var imageview;
//Global bitmap used for composite image/Overlay

//Current selected file location
var selectedimgpath;
var bitmap;
//Base bitmap for effect canvas to export
var basebitmap;
//Overlay bitmap
var secondbitmap;
//Run count for resizing
var runcount = 0;
//First time value for filter performance


let firstTime;
var origimg;
var imgwidth
var imgheight
var optwidth;
var optheight;

function onNavigatingTo(args) {
    const component = args.object;
    component.bindingContext = new HomeItemsViewModel();
}

function onItemTap(args) {
    const view = args.view;
    const page = view.page;
    const tappedItem = view.bindingContext;

    page.frame.navigate({
        moduleName: "home/home-item-detail/home-item-detail-page",
        context: tappedItem,
        animated: true,
        transition: {
            name: "slide",
            duration: 200,
            curve: "ease"
        }
    });
}
exports.stackLoaded = function (args) {
    stackLayout = args.object


}

exports.importImage = function () {
    var context = imagepicker.create({
        mode: "single"
    });
    let list = [];

    //console.log(mainStack.visibility)
    context
        .authorize()
        .then(function () {
            return context.present();
        })
        .then(function (selection) {
            mainStack.visibility = "Visible";
           runcount = 0;
            selection.forEach(function (selected) {
                // process the selected image
                // let selectedbitmap = android.graphics.BitmapFactory.decodeFile(selected.android);
                let importsrc = imageSourceModule.fromFile(selected.android);

                //Image initialization
                origimg = android.graphics.BitmapFactory.decodeFile(selected.android)
                imgheight = origimg.getHeight();
                imgwidth = origimg.getWidth();


                imageview.src = selected.android;
                selectedimgpath = selected.android;
                imageview.android.setImageBitmap(selectedbitmap);
                firstTime = true;


            });
            list.items = selection;

        }).catch(function (e) {
            // process error
            console.log(e.message);
        });

}
exports.showControls = function () {
    mainStack.visibility = "Visible"
}
exports.onImageTap = function (args) {
    imgtag = args.object


}
exports.onImageLoad = function (args) {
    console.log("img loaded");
    imageview = args.object

    // loading the filter overlay
    //Filesystem stuff

    const path = fileSystemModule.path.join(folder.path, "images/pattern.png");
    const localsrc = imageSourceModule.fromFile(path);
    //Decoding as usable bitmap
    secondbitmap = android.graphics.BitmapFactory.decodeFile(path);
}

exports.draw = function (args) {


    //Creating a new bitmap for canvas base
    bitmap = android.graphics.Bitmap.createBitmap(1080, 1000, android.graphics.Bitmap.Config.ARGB_8888);
    //Creating canvas from base bitmap
    var canvas = new android.graphics.Canvas(bitmap);
    //Creating a new paint
    const paint = new android.graphics.Paint();
    //Determining paint color
    var colr = android.graphics.Color.argb(25, 0, 0, 255);
    paint.setColor(colr);
    paint.strokeWidth = 10;

    // Drawing current image to canvas
    imageview.android.draw(canvas);
    //Drawing paint to the canvas
    canvas.drawRect(0, 0, 1080, 1000, paint);
    // Drawing overlay bitmap over canvas (bitmap,source rect size , destination rect size, paint)
    canvas.drawBitmap(secondbitmap, new android.graphics.Rect(0, 0, 500, 500), new android.graphics.Rect(0, 0, 1080, 1000), null);

    imageview.android.setImageBitmap(bitmap);


}

function showToast(msg, len) {
    let ctx = app.android.context;
    console.log("toasting")
    if (len === "short") {
        android.widget.Toast.makeText(ctx, msg, 0).show();
    } else {
        android.widget.Toast.makeText(ctx, msg, 1).show();
    }

}
exports.savePNG = function () {
    console.log("Started Save")
    // Filename using datetime
    let path = fileSystemModule.path.join(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS).getAbsolutePath(), new Date().getTime() + ".png");
    permissions.requestPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE, "To save the image").then(function () {

        try {
            //Create new file with given path
            let file = new java.io.File(path);
            file.createNewFile();
            //Output stream for file 
            let fOut = new java.io.FileOutputStream(file);
            //Compress and save created image
            //Full res next version
            basebitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, fOut);
            showToast("Image saved successfully !", "short")


            fOut.flush();
        } catch (e) {
            console.log(e.message)
        }
    })

}
//Function to convert slider values into color multipliers
function colorMult(color) {
    if (!color) {
        return 0
    } else {

        let colorval = parseInt(color);
        if (colorval <= 255) {
            return (colorval / 255).toFixed(2);
        } else if (colorval === NaN) {
            return 1
        } else if (colorval > 255) {
            return 1
        }
    }

}
exports.mainStackLoaded = function (args) {
    mainStack = args.object;
}
exports.onSliderLoaded = function (args) {
    const slider = args.object;


    slider.on("valueChange", (args) => {
        exports.filter(args);
    })
}
exports.onCheckLoaded = function (args) {
    const slider = args.object;


    slider.on("checkedChange", (args) => {
        exports.filter(args);
    })
}
 
function imageResize() {
  
   
    // Get image width,height
    if (runcount < 2) {
          console.log("Resizing");
        let maxVal = Math.max(imgwidth, imgheight);
        //Scale bitmap according to resolution categories
        if (maxVal > 1000 && maxVal < 1081) {
            //showToast("Big image detected" + imgwidth + " " + imgheight, null);
            optheight = Math.round(imgheight / 1.5);
            optwidth = Math.round(imgwidth / 1.5);
            origimg = android.graphics.Bitmap.createScaledBitmap(origimg, optwidth, optheight, true);
        } else if (maxVal > 1081 && maxVal < 2049) {
            //showToast("Mid image detected" + imgwidth + " " + imgheight, null);
            optheight = Math.round(imgheight / 2.5);
            optwidth = Math.round(imgwidth / 2.5);
            origimg = android.graphics.Bitmap.createScaledBitmap(origimg, optwidth, optheight, true);

        } else if (maxVal > 2049) {
            //showToast("Big image detected" + imgwidth + " " + imgheight, null);
            optheight = Math.round(imgheight / 4);
            optwidth = Math.round(imgwidth / 4);
          
            origimg = android.graphics.Bitmap.createScaledBitmap(origimg, optwidth, optheight, true);

        } else if (maxVal < 1000) {
            //showToast("Small image detected" + imgwidth + " " + imgheight, null);
            optheight = Math.round(imgheight);
            optwidth = Math.round(imgwidth);
            origimg = android.graphics.Bitmap.createScaledBitmap(origimg, optwidth, optheight, true);

        } else {
            optheight = 500;
            optwidth = 500;
            origimg = android.graphics.Bitmap.createScaledBitmap(origimg, optwidth, optheight, true);

        }
        runcount++
    }else{
        //console.log("already resized")
    }

}

exports.filter = function (args) {
    //let caller = args.object.id;
    let perfmode = false;
    //Get values of input elements
    let redVal = mainStack.getViewById("redVal").value;
    let greenVal = mainStack.getViewById("greenVal").value;
    let blueVal = mainStack.getViewById("blueVal").value;
    let satVal = mainStack.getViewById("satVal").value;
    let brightVal = mainStack.getViewById("brightVal").value;
    let contrVal = mainStack.getViewById("contrVal").value;
    let blurVal = mainStack.getViewById("blurVal").value;
    let sharpVal = mainStack.getViewById("sharpVal").checked;
    let binaryVal = mainStack.getViewById("binaryVal").checked;
    let invertVal = mainStack.getViewById("invertVal").checked;


    //Console log inputs for debug
    //console.log(colorMult(redVal), colorMult(blueVal), colorMult(greenVal));
    //Filter func
    //Get image from app's folder
    //Decode resource into bitmap


    if (selectedimgpath) {
        //origimg = android.graphics.BitmapFactory.decodeFile(selectedimgpath);

        //console.log(firstTime)
    } else {
        origpath = fileSystemModule.path.join(folder.path, "images/pickimage.png");
        origimg = android.graphics.BitmapFactory.decodeFile(origpath);

    }

    firstTime = false;
    imageResize();




    //Create empty bitmap
    basebitmap = android.graphics.Bitmap.createBitmap(optwidth, optheight, android.graphics.Bitmap.Config.ARGB_8888);
    //Create empty canvas from bitmap
    let filtercanvas = new android.graphics.Canvas(basebitmap);
    //Creating a new paint
    let filterpaint = new android.graphics.Paint();
    //ADD COLORMATRIX
    var floatArr = Array.create("float", 20);
    //BinaryColor function
    function binaryColor(mult) {
        //defmult -128
        floatArr[0] = 255;
        floatArr[4] = -128 * 255;
        floatArr[6] = 255;
        floatArr[9] = -128 * 255;
        floatArr[12] = 255;
        floatArr[14] = -128 * 255;


    }
    //Grayscale effect function
    function grayscale(mult) {
        floatArr[0] = mult;
        floatArr[1] = mult;
        floatArr[2] = mult;
        floatArr[5] = mult;
        floatArr[6] = mult;
        floatArr[7] = mult;
        floatArr[10] = mult;
        floatArr[11] = mult;
        floatArr[12] = mult;

    }
    //Color invert function
    function invert() {
        floatArr[0] = -1;
        floatArr[4] = 255;
        floatArr[6] = -1;
        floatArr[9] = 255;
        floatArr[12] = -1;
        floatArr[14] = 255;


    }
    //Contrast function

    function setContrast(cm, cval) {
        let contrast = cval / 40
        let scale = contrast //contrast + 1.0;
        let translate = (-0.5 * scale + 0.5) * 255.0;

        let jvarray = Array.create("float", 20);

        let array = [scale, 0, 0, 0, translate,
        0, scale, 0, 0, translate,
        0, 0, scale, 0, translate,
        0, 0, 0, 1, 0]
        for (var i = 0; i < jsArr.length; i++) {
            //console.log(i, jsArr[i]);
            jvarray[i] = new java.lang.Float(array[i])
            //Do something
        }

        let matrix = new android.graphics.ColorMatrix(jvarray);
        cm.postConcat(matrix);
    }

    function setBlur(blurval) {
        let sourceBitmap = basebitmap;

        let outBitmap = android.graphics.Bitmap.createBitmap(basebitmap.getWidth(), basebitmap.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
        let rs = android.renderscript.RenderScript.create(app.android.context);
        let blurScript = android.renderscript.ScriptIntrinsicBlur.create(rs, android.renderscript.Element.U8_4(rs));
        let allIn = android.renderscript.Allocation.createFromBitmap(rs, sourceBitmap);
        let allOut = android.renderscript.Allocation.createFromBitmap(rs, outBitmap);
        blurScript.setRadius(blurVal / 10);
        blurScript.setInput(allIn);
        blurScript.forEach(allOut);
        allOut.copyTo(outBitmap);
        //sourceBitmap.recycle();
        rs.destroy();
        //basebitmap = outBitmap.copy(outBitmap.getConfig(), true);
        //imageview.android.setImageBitmap(outBitmap);
        return outBitmap;


    }

    function setSharpness() {
        let sourceBitmap = basebitmap;
        let outBitmap = android.graphics.Bitmap.createBitmap(basebitmap.getWidth(), basebitmap.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
        let rs = android.renderscript.RenderScript.create(app.android.context);
        let blurScript = android.renderscript.ScriptIntrinsicConvolve3x3.create(rs, android.renderscript.Element.U8_4(rs));
        let allIn = android.renderscript.Allocation.createFromBitmap(rs, sourceBitmap);
        let allOut = android.renderscript.Allocation.createFromBitmap(rs, outBitmap);

        let coef = [0, -0.5, 0,
                   -0.5, 3, -0.5,
                   0, -0.5, 0]

        blurScript.setCoefficients(coef);
        blurScript.setInput(allIn);
        blurScript.forEach(allOut);
        allOut.copyTo(outBitmap);
        //sourceBitmap.recycle();
        rs.destroy();
        //basebitmap = outBitmap.copy(outBitmap.getConfig(), true);
        //imageview.android.setImageBitmap(outBitmap);
        return outBitmap;


    }
    //Brightness function
    function brighten(cm, brmult) {

        let brightmult = brmult / 40
        //console.log("Brightness:", brightmult)
        let brightMatrix = new android.graphics.ColorMatrix();
        brightMatrix.setScale(brightmult, brightmult, brightmult, brightmult);
        cm.postConcat(brightMatrix);
    }
    //Saturation function
    function saturate(cm, stmult) {
        //Get exact saturation value from 0-100 to 0-5
        let satmult = stmult / 40
        //Debug log
        //console.log("Sat:", satmult)
        //New empty matrix
        let satMatrix = new android.graphics.ColorMatrix();
        //Set saturation for new matrix
        satMatrix.setSaturation(satmult);
        //Concat new and old matrix
        cm.postConcat(satMatrix);
    }
    //JS array for empty matrix
    var jsArr = [1, 0, 0, 0, 0,
              0, 0, 0, 0, 0,
              0, 0, 0, 0, 0,
              0, 0, 0, 1, 0];

    //Converting JS array to Java float array  
    for (var i = 0; i < jsArr.length; i++) {
        //console.log(i, jsArr[i]);
        floatArr[i] = new java.lang.Float(jsArr[i])

    }

    //Adjusting color functions for color amounts
    floatArr[0] = colorMult(redVal);
    floatArr[6] = colorMult(greenVal);
    floatArr[12] = colorMult(blueVal);
    if (binaryVal) {
        binaryColor(-128);
    }
    if (invertVal) {
        invert();
    }

    //Create colormatrix from adjusted java array
    var colormatrix = new android.graphics.ColorMatrix(floatArr);
    //Add saturation
    if (perfmode) {
        if (caller === "satVal") {
            saturate(colormatrix, satVal);
        } else if (caller === "brightVal") {
            //Add brightness
            brighten(colormatrix, brightVal);
        } else if (caller === "contrVal") {
            setContrast(colormatrix, contrVal);
        } else if (caller === "blurVal") {
            setBlur(blurVal);

        }

    }
    saturate(colormatrix, satVal);
    brighten(colormatrix, brightVal);
    setContrast(colormatrix, contrVal);
    setBlur(blurVal);

    //New colorfilter from final matrix
    var colorfilter = new android.graphics.ColorMatrixColorFilter(colormatrix);
    //Set filter to the paint
    filterpaint.setColorFilter(colorfilter);
    //Draw bitmap with filtered paint
    filtercanvas.drawBitmap(origimg, new android.graphics.Rect(0, 0, optwidth, optheight), new android.graphics.Rect(0, 0, optwidth, optheight), filterpaint);
    filtercanvas.drawBitmap(setBlur(blurVal), new android.graphics.Rect(0, 0, optwidth, optheight), new android.graphics.Rect(0, 0, optwidth, optheight), new android.graphics.Paint());
    if (sharpVal) {
        filtercanvas.drawBitmap(setSharpness(), new android.graphics.Rect(0, 0, optwidth, optheight), new android.graphics.Rect(0, 0, optwidth, optheight), new android.graphics.Paint());
    }



    //Show final bitmap in the imageview
    imageview.android.setImageBitmap(basebitmap);
    //imageview.android.setImageBitmap();


}
//To know when app resumes for further bugfix
app.android.on(app.AndroidApplication.activityResumedEvent, function (args) {
    console.log("resumed");
});

exports.reset = function (args) {
    mainStack.getViewById("redVal").value = 255;
    mainStack.getViewById("greenVal").value = 255;
    mainStack.getViewById("blueVal").value = 255;
    mainStack.getViewById("satVal").value = 40;
    mainStack.getViewById("brightVal").value = 40;
    mainStack.getViewById("contrVal").value = 40;
    mainStack.getViewById("blurVal").value = 1;
    mainStack.getViewById("sharpVal").checked = false;
    mainStack.getViewById("binaryVal").checked = false;
    mainStack.getViewById("invertVal").checked = false;
    exports.filter();
}


exports.onItemTap = onItemTap;
exports.onNavigatingTo = onNavigatingTo;
