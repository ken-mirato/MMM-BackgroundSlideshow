/* global Module */

/* MMM-BackgroundSlideshow.js
 *
 * Magic Mirror
 * Module: MMM-BackgroundSlideshow
 *
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * Module MMM-Slideshow By Darick Carpenter
 * MIT Licensed.
 */

Module.register('MMM-BackgroundSlideshow', {
  // Default module config.
  defaults: {
    // an array of strings, each is a path to a directory with images
    imagePaths: ['modules/MMM-BackgroundSlideshow/exampleImages'],
    // do not recurse into these subdirectory names when scanning.
    excludePaths: ['@eaDir'],
    // the speed at which to switch between images, in milliseconds
    slideshowSpeed: 10 * 1000,
    // if true randomize image order, otherwise use sortImagesBy and sortImagesDescending
    randomizeImageOrder: false,
    // how to sort images: name, random, created, modified
    sortImagesBy: 'created',
    // whether to sort in ascending (default) or descending order
    sortImagesDescending: false,
    // if false each path with be viewed separately in the order listed
    recursiveSubDirectories: false,
    // list of valid file extensions, separated by commas
    validImageFileExtensions: 'bmp,jpg,jpeg,gif,png',
    // show a panel containing information about the image currently displayed.
    showImageInfo: false,
    // EXIF情報のタイトルヘッダを表示するかどうか
    showImageInfoHeader: true,
    // EXIF情報の住所を表示するかどうか（GoogleMapAPI利用。APIキーを指定する）
    googleMapApiKey: '',
    // EXIF情報の地名を更に特定の表示名に置き換えるか（{key: [***,***], displayName: ***, displayNameSub: ***} 形式で記載。
    // keyに指定した文字が含まれる場合、displayNameを住所の代わりに表示する）
    imagePlaceDictionary: [],
    // 当時何才か表示する情報（{ name: ***, year: yyyy, month: mm, day: dd }で記載）
    imageInfoBirthday: [],
    // a comma separated list of values to display: name, date, geo (TODO)
    imageInfo: 'name, date, imagecount',
    // location of the info div
    imageInfoLocation: 'bottomRight', // Other possibilities are: bottomLeft, topLeft, topRight
    // transition speed from one image to the other, transitionImages must be true
    transitionSpeed: '2s',
    // show a progress bar indicating how long till the next image is displayed.
    showProgressBar: false,
    // the sizing of the background image
    // cover: Resize the background image to cover the entire container, even if it has to stretch the image or cut a little bit off one of the edges
    // contain: Resize the background image to make sure the image is fully visible
    backgroundSize: 'full', // cover or contain or full
    // if backgroundSize contain, determine where to zoom the picture. Towards top, center or bottom
    backgroundPosition: 'center', // Most useful options: "top" or "center" or "bottom"
    // transition from one image to the other (may be a bit choppy on slower devices, or if the images are too big)
    transitionImages: false,
    // the gradient to make the text more visible
    gradient: [
      'rgba(0, 0, 0, 0.75) 0%',
      'rgba(0, 0, 0, 0) 40%',
      'rgba(0, 0, 0, 0) 80%',
      'rgba(0, 0, 0, 0.75) 100%'
    ],
    horizontalGradient: [
      'rgba(0, 0, 0, 0.75) 0%',
      'rgba(0, 0, 0, 0) 40%',
      'rgba(0, 0, 0, 0) 80%',
      'rgba(0, 0, 0, 0.75) 100%'
    ],
    radialGradient: [
      'rgba(0,0,0,0) 0%',
      'rgba(0,0,0,0) 75%',
      'rgba(0,0,0,0.25) 100%'
    ],
    // the direction the gradient goes, vertical, horizontal, both or radial
    gradientDirection: 'vertical',
    // Whether to scroll larger pictures rather than cut them off
    backgroundAnimationEnabled: false,
    // How long the scrolling animation should take - if this is more than slideshowSpeed, then images do not scroll fully.
    // If it is too fast, then the image may apear gittery. For best result, by default we match this to slideshowSpeed.
    // For now, it is not documented and will default to match slideshowSpeed.
    backgroundAnimationDuration: '1s',
    // How many times to loop the scrolling back and forth.  If the value is set to anything other than infinite, the
    // scrolling will stop at some point since we reuse the same div1.
    // For now, it is not documentd and is defaulted to infinite.
    backgroundAnimationLoopCount: 'infinite',
    // Transitions to use
    transitions: [
      'opacity',
      'slideFromRight',
      'slideFromLeft',
      'slideFromTop',
      'slideFromBottom',
      'slideFromTopLeft',
      'slideFromTopRight',
      'slideFromBottomLeft',
      'slideFromBottomRight',
      'flipX',
      'flipY'
    ],
    transitionTimingFunction: 'cubic-bezier(.17,.67,.35,.96)',
    animations: ['slide', 'zoomOut', 'zoomIn'],
    changeImageOnResume: false,
    resizeImages: false,
    maxWidth: 1920,
    maxHeight: 1080,
    // remove the file extension from image name
    imageInfoNoFileExt: false,
  },

  // load function
  start: function () {
    // add identifier to the config
    this.config.identifier = this.identifier;
    // ensure file extensions are lower case
    this.config.validImageFileExtensions = this.config.validImageFileExtensions.toLowerCase();
    // ensure image order is in lower case
    this.config.sortImagesBy = this.config.sortImagesBy.toLowerCase();
    // commented out since this was not doing anything
    // set no error
    // this.errorMessage = null;

    // APIキー登録があった場合はスクリプト読み込み
    if (this.config.googleMapApiKey.length != 0) {
      var script = document.createElement("script");
      script.src = "https://maps.googleapis.com/maps/api/js?language=ja&key=" + this.config.googleMapApiKey + "&callback=initMap";
      window.initMap = function() {
        console.log("Google map api script load success");
      };
      document.querySelector("body").appendChild(script);
    }
      
    //validate imageinfo property.  This will make sure we have at least 1 valid value
    const imageInfoRegex = /\bname\b|\bdate\b/gi;
    if (
      this.config.showImageInfo &&
      !imageInfoRegex.test(this.config.imageInfo)
    ) {
      Log.warn(
        'MMM-BackgroundSlideshow: showImageInfo is set, but imageInfo does not have a valid value.'
      );
      // Use name as the default
      this.config.imageInfo = ['name'];
    } else {
      // convert to lower case and replace any spaces with , to make sure we get an array back
      // even if the user provided space separated values
      this.config.imageInfo = this.config.imageInfo
        .toLowerCase()
        .replace(/\s/g, ',')
        .split(',');
      // now filter the array to only those that have values
      this.config.imageInfo = this.config.imageInfo.filter((n) => n);
    }

    if (!this.config.transitionImages) {
      this.config.transitionSpeed = '0';
    }

    // Lets make sure the backgroundAnimation duration matches the slideShowSpeed unless it has been
    // overriden
    if (this.config.backgroundAnimationDuration === '1s') {
      this.config.backgroundAnimationDuration =
        this.config.slideshowSpeed / 1000 + 's';
    }

    // Chrome versions < 81 do not support EXIF orientation natively. A CSS transformation
    // needs to be applied for the image to display correctly - see http://crbug.com/158753 .
    this.browserSupportsExifOrientationNatively = CSS.supports(
      'image-orientation: from-image'
    );

    this.playingVideo = false;
  },

  getScripts: function () {
    return [
      'modules/' + this.name + '/node_modules/exif-js/exif.js',
      'modules/' + this.name + '/node_modules/lodash/lodash.js',
      'moment.js'
    ];
  },

  getStyles: function () {
    // the css contains the make grayscale code
    return ['BackgroundSlideshow.css'];
  },

	getTranslations: function() {
		return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      de: "translations/de.json",
		};
  },

  // generic notification handler
  notificationReceived: function (notification, payload, sender) {

  },

  updateImageListWithArray: function (urls) {
    this.imageList = urls.splice(0);
    this.imageIndex = 0;
    this.updateImage();
    if (
      !this.playingVideo &&
      (this.timer || (this.savedImages && this.savedImages.length == 0))
    ) {
      // Restart timer only if timer was already running
      this.resume();
    }
  },

  // the socket handler
  socketNotificationReceived: function (notification, payload) {
    // if an update was received

    // check this is for this module based on the woeid
    if (notification === 'BACKGROUNDSLIDESHOW_READY') {
      // // console.info('Returning Images, payload:' + JSON.stringify(payload));
      // // set the image list
      // if (this.savedImages) {
      //   this.savedImages = payload.imageList;
      //   this.savedIndex = 0;
      // } else {
      //   this.imageList = payload.imageList;
      //   // if image list actually contains images
      //   // set loaded flag to true and update dom
      //   if (this.imageList.length > 0) {
      //     this.updateImage(); //Added to show the image at least once, but not change it within this.resume()
      //     if (!this.playingVideo) {
      //       this.resume();
      //     }
      //   }
      // }
      if (payload.identifier === this.identifier) {
        this.sendSocketNotification('BACKGROUNDSLIDESHOW_NEXT_IMAGE');
        if (!this.playingVideo) {
          this.resume();
        }
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_REGISTER_CONFIG') {
      // Update config in backend
      this.updateImageList();
    } else if (notification === 'BACKGROUNDSLIDESHOW_PLAY') {
      // Change to next image and start timer.
      this.updateImage();
      if (!this.playingVideo) {
        this.resume();
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_DISPLAY_IMAGE') {
      // check this is for this module based on the woeid
      if (payload.identifier === this.identifier) {
        this.displayImage(payload);
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_FILELIST') {
      //bubble up filelist notifications
      this.sendSocketNotification('BACKGROUNDSLIDESHOW_FILELIST', payload);
    } else if (notification === 'BACKGROUNDSLIDESHOW_UPDATE_IMAGE_LIST') {
      this.imageIndex = -1;
      this.updateImageList();
      this.updateImage();
    } else if (notification === 'BACKGROUNDSLIDESHOW_IMAGE_UPDATE') {
      Log.log('MMM-BackgroundSlideshow: Changing Background');
      this.suspend();
      this.updateImage();
      if (!this.playingVideo) {
        this.resume();
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_NEXT') {
      // Change to next image
      this.updateImage();
      if (this.timer && !this.playingVideo) {
        // Restart timer only if timer was already running
        this.resume();
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_PREVIOUS') {
      // Change to previous image
      this.updateImage(/* skipToPrevious= */ true);
      if (this.timer && !this.playingVideo) {
        // Restart timer only if timer was already running
        this.resume();
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_PAUSE') {
      // Stop timer.
      this.suspend();
    } else if (notification === 'BACKGROUNDSLIDESHOW_URL') {
      if (payload && payload.url) {
        // Stop timer.
        if (payload.resume) {
          if (this.timer) {
            // Restart timer only if timer was already running
            this.resume();
          }
        } else {
          this.suspend();
        }
        this.updateImage(false, payload.url);
      }
    } else if (notification === 'BACKGROUNDSLIDESHOW_URLS') {
      console.log(
        `Notification Received: BACKGROUNDSLIDESHOW_URLS. Payload: ${JSON.stringify(
          payload
        )}`
      );
      if (payload && payload.urls && payload.urls.length) {
        // check if image list has been saved. If not, this is the first time the notification is received
        // save the image list and index.
        if (!this.savedImages) {
          this.savedImages = this.imageList;
          this.savedIndex = this.imageIndex;
          this.updateImageListWithArray(payload.urls);
        } else {
          // check if there the sent urls are the same, or different.
          let temp = _.union(payload.urls, this.imageList);
          // if they are the same length, then they haven't changed, so don't do anything.
          if (temp.length !== payload.urls.length) {
            this.updateImageListWithArray(payload.urls);
          }
        }
        // no urls sent, see if there is saved data.
      } else if (this.savedImages) {
        this.imageList = this.savedImages;
        this.imageIndex = this.savedIndex;
        this.savedImages = null;
        this.savedIndex = null;
        this.updateImage();
        if (this.timer && !this.playingVideo) {
          // Restart timer only if timer was already running
          this.resume();
        }
      }
    } else {
      // Log.log(this.name + " received a system notification: " + notification);
    }
  },

  // Override dom generator.
  getDom: function () {
    var wrapper = document.createElement('div');
    this.imagesDiv = document.createElement('div');
    this.imagesDiv.className = 'images';
    wrapper.appendChild(this.imagesDiv);

    if (
      this.config.gradientDirection === 'vertical' ||
      this.config.gradientDirection === 'both'
    ) {
      this.createGradientDiv('bottom', this.config.gradient, wrapper);
    }

    if (
      this.config.gradientDirection === 'horizontal' ||
      this.config.gradientDirection === 'both'
    ) {
      this.createGradientDiv('right', this.config.horizontalGradient, wrapper);
    }

    if (
      this.config.gradientDirection === 'radial'
    ) {
      this.createRadialGradientDiv('ellipse at center', this.config.radialGradient, wrapper);
    }

    if (this.config.showImageInfo) {
      this.imageInfoDiv = this.createImageInfoDiv(wrapper);
    }

    if (this.config.showProgressBar) {
      this.createProgressbarDiv(wrapper, this.config.slideshowSpeed);
    }

    if (this.config.imagePaths.length == 0) {
      Log.error(
        'MMM-BackgroundSlideshow: Missing required parameter imagePaths.'
      );
    } else {
      // create an empty image list
      this.imageList = [];
      // set beginning image index to 0, as it will auto increment on start
      this.imageIndex = 0;
      this.updateImageList();
    }

    return wrapper;
  },

  createGradientDiv: function (direction, gradient, wrapper) {
    var div = document.createElement('div');
    div.style.backgroundImage =
      'linear-gradient( to ' + direction + ', ' + gradient.join() + ')';
    div.className = 'gradient';
    wrapper.appendChild(div);
  },

  createRadialGradientDiv: function (type, gradient, wrapper) {
    var div = document.createElement('div');
    div.style.backgroundImage =
      'radial-gradient( ' + type + ', ' + gradient.join() + ')';
    div.className = 'gradient';
    wrapper.appendChild(div);
  },

  createDiv: function () {
    var div = document.createElement('div');
    if (this.config.backgroundSize == 'full') {
      div.style.backgroundSize = 'contain';
    }
    else {
      div.style.backgroundSize = this.config.backgroundSize;
    }
    div.style.backgroundPosition = this.config.backgroundPosition;
    div.className = 'image';
    return div;
  },

  createImageInfoDiv: function (wrapper) {
    const div = document.createElement('div');
    div.className = 'info ' + this.config.imageInfoLocation;
    wrapper.appendChild(div);
    return div;
  },

  createProgressbarDiv: function (wrapper, slideshowSpeed) {
    const div = document.createElement('div');
    div.className = 'progress';
    const inner = document.createElement('div');
    inner.className = 'progress-inner';
    inner.style.display = 'none';
    inner.style.animation = `move ${slideshowSpeed}ms linear`;
    div.appendChild(inner);
    wrapper.appendChild(div);
  },
  displayImage: function (imageinfo) {
    const mw_lc = imageinfo.path.toLowerCase();
    if (mw_lc.endsWith('.mp4') || mw_lc.endsWith('.m4v')) {
      payload = [imageinfo.path, 'PLAY'];
      imageinfo.data = 'modules/MMM-BackgroundSlideshow/transparent1080p.png';
      this.sendSocketNotification('BACKGROUNDSLIDESHOW_PLAY_VIDEO', payload);
      this.playingVideo = true;
      this.suspend();
    } else {
      this.playingVideo = false;
    }

    const image = new Image();
    image.onload = () => {
      // check if there are more than 2 elements and remove the first one
      if (this.imagesDiv.childNodes.length > 1) {
        this.imagesDiv.removeChild(this.imagesDiv.childNodes[0]);
      }
      if (this.imagesDiv.childNodes.length > 0) {
        this.imagesDiv.childNodes[0].style.opacity = '0';
      }

      const transitionDiv = document.createElement('div');
      transitionDiv.className = 'transition';
      if (this.config.transitionImages && this.config.transitions.length > 0) {
        let randomNumber = Math.floor(
          Math.random() * this.config.transitions.length
        );
        transitionDiv.style.animationDuration = this.config.transitionSpeed;
        transitionDiv.style.transition = `opacity ${this.config.transitionSpeed} ease-in-out`;
        transitionDiv.style.animationName = this.config.transitions[
          randomNumber
        ];
        transitionDiv.style.animationTimingFunction = this.config.transitionTimingFunction;
      }

      const imageDiv = this.createDiv();
      imageDiv.style.backgroundImage = `url("${image.src}")`;
      // imageDiv.style.transform = 'rotate(0deg)';

      // this.div1.style.backgroundImage = `url("${image.src}")`;
      // this.div1.style.opacity = '1';

      if (this.config.showProgressBar) {
        // Restart css animation
        const oldDiv = document.getElementsByClassName('progress-inner')[0];
        const newDiv = oldDiv.cloneNode(true);
        oldDiv.parentNode.replaceChild(newDiv, oldDiv);
        newDiv.style.display = '';
      }

      // Check to see if we need to animate the background
      if (
        this.config.backgroundAnimationEnabled &&
        this.config.animations.length
      ) {
        randomNumber = Math.floor(
          Math.random() * this.config.animations.length
        );
        const animation = this.config.animations[randomNumber];
        imageDiv.style.animationDuration = this.config.backgroundAnimationDuration;
        imageDiv.style.animationDelay = this.config.transitionSpeed;

        if (animation === 'slide') {
          // check to see if the width of the picture is larger or the height
          var width = image.width;
          var height = image.height;
          var adjustedWidth = (width * window.innerHeight) / height;
          var adjustedHeight = (height * window.innerWidth) / width;

          imageDiv.style.backgroundPosition = '';
          imageDiv.style.animationIterationCount = this.config.backgroundAnimationLoopCount;
          imageDiv.style.backgroundSize = 'cover';

          if (
            adjustedWidth / window.innerWidth >
            adjustedHeight / window.innerHeight
          ) {
            // Scrolling horizontally...
            if (Math.floor(Math.random() * 2)) {
              imageDiv.className += ' slideH';
            } else {
              imageDiv.className += ' slideHInv';
            }
          } else {
            // Scrolling vertically...
            if (Math.floor(Math.random() * 2)) {
              imageDiv.className += ' slideV';
            } else {
              imageDiv.className += ' slideVInv';
            }
          }
        } else {
          imageDiv.className += ` ${animation}`;
        }
      }

      EXIF.getData(image, () => {
        if (this.config.showImageInfo) {
          let dateTime = EXIF.getTag(image, 'DateTimeOriginal');
          // attempt to parse the date if possible
          if (dateTime !== null) {
            try {
              dateTime = moment(dateTime, 'YYYY:MM:DD HH:mm:ss');
            } catch (e) {
              console.log(
                'Failed to parse dateTime: ' +
                dateTime +
                ' to format YYYY:MM:DD HH:mm:ss'
              );
              dateTime = '';
            }
          }
          // TODO: allow for location lookup via openMaps
          // let lat = EXIF.getTag(this, "GPSLatitude");
          // let lon = EXIF.getTag(this, "GPSLongitude");
          // // Only display the location if we have both longitute and lattitude
          // if (lat && lon) {
          //   // Get small map of location
          // }
          //this.updateImageInfo(imageinfo, dateTime);

          // GoogleMapAPIキーが指定されている場合、緯度経度から住所を取得する
          let apidone = false;
          if ((this.config.googleMapApiKey.length != 0)
           && (this.config.imageInfo.indexOf("place") != -1)) {
            // 緯度経度取得
            let latInfo = EXIF.getTag(image, "GPSLatitude");
            let lonInfo = EXIF.getTag(image, "GPSLongitude");
            if (latInfo && lonInfo) {
              // 数値変換
              let lat = latInfo[0]/1 + latInfo[1]/60 + latInfo[2]/3600;
              let lon = lonInfo[0]/1 + lonInfo[1]/60 + lonInfo[2]/3600;
              // GoogleMapAPI実行
              apidone = true;
              this.getLocation(lat, lon).then((address) => {
                // 住所取得した場合は、カスタム表示名に変換してから、表示更新
                let place = this.setCustomLocation(address);
                this.updateImageInfo(imageinfo, dateTime, place);
              });
            }
          }
          // 住所取得していない場合はそのまま表示更新
          if (apidone == false) {
            this.updateImageInfo(imageinfo, dateTime, "");
          }
        }

        if (!this.browserSupportsExifOrientationNatively) {
          const exifOrientation = EXIF.getTag(image, 'Orientation');
          imageDiv.style.transform = this.getImageTransformCss(exifOrientation);
        }
      });
      
      if (this.config.backgroundSize == 'full') {
        let imageDivClone = imageDiv.cloneNode();
        imageDivClone.style.backgroundSize = 'cover';
        imageDivClone.style.opacity = '0.5';
        transitionDiv.appendChild(imageDivClone);
      }
      transitionDiv.appendChild(imageDiv);
      this.imagesDiv.appendChild(transitionDiv);
    };

    image.src = imageinfo.data;
    this.sendSocketNotification('BACKGROUNDSLIDESHOW_IMAGE_UPDATED', {
      url: imageinfo.path
    });
  },

  async getLocation(lat, lon) {
    return new Promise(resolve => {
      //Google Maps APIのジオコーダを使います。
      let latLngInput = new google.maps.LatLng(lat, lon);
      let geocoder = new google.maps.Geocoder();
            
      //ジオコーダのgeocodeを実行します。
      //第１引数のリクエストパラメータにlatLngプロパティを設定します。
      //第２引数はコールバック関数です。取得結果を処理します。
      geocoder.geocode(
          { latLng: latLngInput },
          (results, status) => {
              let address = "";
              // 取得が成功した場合,住所が正確に格納されているデータを採用する
              if (status == google.maps.GeocoderStatus.OK) {
                address = this.getStreetAddress(results);
              } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
                  console.log("住所が見つかりませんでした。");
              } else if (status == google.maps.GeocoderStatus.ERROR) {
                  console.log("サーバ接続に失敗しました。");
              } else if (status == google.maps.GeocoderStatus.INVALID_REQUEST) {
                  console.log("リクエストが無効でした。");
              } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                  console.log("リクエストの制限回数を超えました。");
              } else if (status == google.maps.GeocoderStatus.REQUEST_DENIED) {
                  console.log("サービスが使えない状態でした。");
              } else if (status == google.maps.GeocoderStatus.UNKNOWN_ERROR) {
                  console.log("原因不明のエラーが発生しました。");
              }
              resolve(address);
          }
      );
    });
  },
  
  // GoogleMapAPIの結果から、郵便番号が含まれているある程度詳細な住所を選定する
  getStreetAddress: function (results) {
    let result = "";
    let street_address = "";
    let premise = "";
    let first = "";
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const type = result.types[0];
      if (type == "plus_code") {
        continue;
      }
      if (first == "") {
        first = result.formatted_address
      }
      if (type == "street_address") {
        street_address = result.formatted_address;
      }
      else if (type == "premise") {
        premise = result.formatted_address;
      }
    }

    if (street_address != "") {
      result = street_address;
    }
    else if (premise != "") {
      result = premise;
    }
    else {
      result = first;
    }
    return result;
  },

  setCustomLocation: function (address) {
      console.log("GoogleAPI Result [" + address + "]");
      let place = "";
      for (let i = 0; i < this.config.imagePlaceDictionary.length; i++) {
        const dic = this.config.imagePlaceDictionary[i];
        for (let j = 0; j < dic.key.length; j++) {
          const key = dic.key[j];
          if (address.indexOf(key) != -1) {
            place = dic.displayName;
            if (dic.displayNameSub != "") {
              place += '\n' + dic.displayNameSub;
              place = '<div class="wrap">' + place + '</div>'
            }
            break;
          }
        }  
      }
      if (place.length == 0) {
          place = address;
          const fullnums = '０１２３４５６７８９';
          place = place.replace("日本", "");				// 国削除
          place = place.replace(/([、 ])/, "");				// 国削除
          //place = place.replace(/(〒\d{3}-\d{4})/, "");	// 郵便番号削除
          place = place.replace("−","-")					// 番地を半角変換
          place = place.replace(/[０-９]/g, m=>'０１２３４５６７８９'.indexOf(m));
      }
      console.log("place is [" + place + "]");
      return place;
  },

  getAfterBirth: function (imageDate, bYear, bMonth, bDay, isShort = false) {
    // 誕生日日時のDateを取得
    const dateBirth = new Date(bYear, bMonth-1, bDay);

    // 現在日時までのミリ秒と日数を計算
    const timeTillNow = imageDate.getTime() - dateBirth.getTime(); 
    const daysTillNow = timeTillNow / (1000 * 3600 * 24); 

    // 年齢の年部分・月部分・日部分をそれぞれ計算
    const DAYS_PER_MONTH = 365 / 12;
    const ageY = Math.floor(daysTillNow / 365);
    const ageM = Math.floor((daysTillNow - 365*ageY) / DAYS_PER_MONTH);
    //const ageD = Math.floor((daysTillNow - 365*ageY - DAYS_PER_MONTH*ageM));

    const dispAgeY = ("" + ageY).replace(/[0-9]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
    if (isShort) {
      return dispAgeY + "才" + ((ageM >= 6) ? "半" : "");
    }
    else {
      return dispAgeY + "才" + (ageM < 10 ? '<span class="trans">0</span>' : '') + ageM + "ヶ月";
    }

  },

  updateImage: function (backToPreviousImage = false, imageToDisplay = null) {
    if (imageToDisplay) {
      this.displayImage({
        path: imageToDisplay,
        data: imageToDisplay,
        index: 1,
        total: 1
      });
      return;
    }

    if (this.imageList.length > 0) {
      this.imageIndex = this.imageIndex + 1;

      if (this.config.randomizeImageOrder) {
        this.imageIndex = Math.floor(Math.random() * (this.imageList.length));
      }

      imageToDisplay = this.imageList.splice(this.imageIndex, 1);
      this.displayImage({
        path: imageToDisplay[0],
        data: imageToDisplay[0],
        index: 1,
        total: 1
      });
      return;
    }

    if (backToPreviousImage) {
      this.sendSocketNotification('BACKGROUNDSLIDESHOW_PREV_IMAGE');
    } else {
      this.sendSocketNotification('BACKGROUNDSLIDESHOW_NEXT_IMAGE');
    }
  },

  getImageTransformCss: function (exifOrientation) {
    switch (exifOrientation) {
      case 2:
        return 'scaleX(-1)';
      case 3:
        return 'scaleX(-1) scaleY(-1)';
      case 4:
        return 'scaleY(-1)';
      case 5:
        return 'scaleX(-1) rotate(90deg)';
      case 6:
        return 'rotate(90deg)';
      case 7:
        return 'scaleX(-1) rotate(-90deg)';
      case 8:
        return 'rotate(-90deg)';
      case 1: // Falls through.
      default:
        return 'rotate(0deg)';
    }
  },

  updateImageInfo: function (imageinfo, imageDate, place) {
    let imageProps = [];
    this.config.imageInfo.forEach((prop, idx) => {
      switch (prop) {
        case 'date':
          if (imageDate && imageDate != 'Invalid date') {
            const displayDateTime = imageDate.format('YYYY / MM / DD (ddd) HH:mm');
            imageProps.push(displayDateTime);
          }
          break;

        case 'place':
          if (place && place.length != 0) {
            // 郵便番号が含まれる場合は長い住所なので、CSS調整用にdivで囲っておく
            if (place.indexOf("〒") != -1) {
              imageProps.push('<div class="full-address">' + place + '</div>');
            }
            else {
              imageProps.push(place);
            }
          }
          break;

        case 'birth-full':
        case 'birth-short':
        case 'birth-full-single':
        case 'birth-short-single':
          if (this.config.imageInfoBirthday.length != 0) {
            const isShort = (prop.indexOf("short") != -1);
            const isSingle = (prop.indexOf("single") != -1);
            let doms = [];
            for (let i = 0; i < this.config.imageInfoBirthday.length; i++) {
              const dic = this.config.imageInfoBirthday[i];
              const displayBirth = this.getAfterBirth(imageDate.toDate(), dic.year, dic.month, dic.day, isShort);
              doms.push(dic.name + '<span class="trans">a</span>' + displayBirth);
            }
            if (doms.length != 0) {
              imageProps.push('<div class="birthday wrap">' +doms.join(isSingle ? ' / ' : '\n') + '</div>');
            }
          }
          break;

        case 'name': // default is name
          // Only display last path component as image name if recurseSubDirectories is not set.
          let imageName = imageinfo.path.split('/').pop();

          // Otherwise display path relative to the path in configuration.
          if (this.config.recursiveSubDirectories) {
            for (const path of this.config.imagePaths) {
              if (!imageinfo.path.includes(path)) {
                continue;
              }

              imageName = imageinfo.path.split(path).pop();
              if (imageName.startsWith('/')) {
                imageName = imageName.substr(1);
              }
              break;
            }
          }
          // Remove file extension from image name.
          if (this.config.imageInfoNoFileExt) {
            imageName = imageName.substring(0, imageName.lastIndexOf('.'));
          }
          imageProps.push(imageName);
          break;
        case 'imagecount':
          imageProps.push(`${imageinfo.index} of ${imageinfo.total}`);
          break;
        default:
          Log.warn(
            prop +
            ' is not a valid value for imageInfo.  Please check your configuration'
          );
      }
    });

    let innerHTML = this.config.showImageInfoHeader
    	? '<header class="infoDivHeader">' + this.translate('PICTURE_INFO') + '</header>'
    	: '';
    imageProps.forEach((val, idx) => {
      if (val.indexOf("<div ") != -1) {
        innerHTML += val;
      }
      else {
        innerHTML += val + '<br/>';
      }
    });

    this.imageInfoDiv.innerHTML = innerHTML;
  },

  suspend: function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  resume: function () {
    //this.updateImage(); //Removed to prevent image change whenever MMM-Carousel changes slides
    this.suspend();
    var self = this;

    if (self.config.changeImageOnResume) {
      self.updateImage();
    }

    this.timer = setInterval(function () {
      // console.info('MMM-BackgroundSlideshow updating from resume');
      self.updateImage();
    }, self.config.slideshowSpeed);
  },

  updateImageList: function () {
    this.suspend();
    // console.info('Getting Images');
    // ask helper function to get the image list
    this.sendSocketNotification(
      'BACKGROUNDSLIDESHOW_REGISTER_CONFIG',
      this.config
    );
  }
});
