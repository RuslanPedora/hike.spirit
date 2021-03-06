"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var router_1 = require("@angular/router");
var data_service_1 = require("hs_services/data.service");
var item_1 = require("hs_core/item");
var ItemComponent = (function () {
    //-----------------------------------------------------------------------------
    function ItemComponent(router, activatedRoute, dataService) {
        this.router = router;
        this.activatedRoute = activatedRoute;
        this.dataService = dataService;
        this.item = new item_1.Item();
        this.itemProperties = [];
        this.loupeFragment = 'logo.jpg';
        this.reEnter = false;
        this.mouseEntered = false;
        this.debugString = '';
        this.detailBlockIndex = 0;
    }
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.activatedRoute.queryParams.subscribe(function (queryParams) {
            var itemId = queryParams['id' + _this.dataService.getItemPrefix()];
            if (itemId != undefined) {
                _this.getItem(Number.parseInt(itemId));
                _this.getItemProperties(Number.parseInt(itemId));
            }
        });
        window.scrollTo(0, 0);
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.getItem = function (itemId) {
        var _this = this;
        var tempList;
        this.dataService.getItemList('/?' + JSON.stringify({ id_IT: itemId }))
            .then(function (itemList) {
            tempList = itemList;
            _this.dataService.converRate(tempList);
            if (tempList.length > 0) {
                _this.item = tempList[0];
                _this.dataService.addToViewItem(_this.item);
                _this.dataService.buildPath(_this.item);
                if (_this.reEnter && _this.item.imageList.length > 0) {
                    _this.loupeFragment = _this.item.imageList[0].bigImage;
                    _this.mouseEntered = true;
                    _this.posBigImage(_this.offsetX, _this.offsetY, _this.clientWidth, _this.clientHeight);
                }
                window.scrollTo(0, 0);
            }
        });
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.getItemProperties = function (itemId) {
        var _this = this;
        this.dataService.getItemProperties('/?' + JSON.stringify({ id: itemId }))
            .then(function (itemProperties) {
            return _this.itemProperties = itemProperties;
        });
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.scrollBigImage = function (forward) {
        var imageIndex = 0;
        var i;
        var item = this.item;
        if (item.imageList.length <= 1)
            return;
        imageIndex = item.imageList.findIndex(function (element) { return element.shift == 0; });
        if (forward && imageIndex == item.imageList.length - 1) {
            for (i in item.imageList)
                item.imageList[i].shift = 100 * i;
        }
        else if (!forward && imageIndex == 0) {
            for (i in item.imageList)
                item.imageList[i].shift = -100 * (item.imageList.length - i - 1);
        }
        else {
            for (i in item.imageList)
                item.imageList[i].shift += forward ? -100 : 100;
        }
        this.scrollSmallImageList();
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.smallImageSelect = function (index) {
        var i;
        for (i in this.item.imageList) {
            this.item.imageList[i].shift = (i - index) * 100;
        }
        this.scrollSmallImageList();
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.scrollSmallImageList = function () {
        var i;
        var delta = 0;
        if (this.item.imageList[0].shift / 100 == 0) {
            delta = -40;
        }
        if (this.item.imageList[0].shift / 100 == -1) {
            delta = -20;
        }
        if (this.item.imageList.length > 5) {
            if (this.item.imageList[this.item.imageList.length - 1].shift == 0) {
                delta = 40;
            }
            if (this.item.imageList[this.item.imageList.length - 2].shift == 0) {
                delta = 20;
            }
        }
        for (i in this.item.imageList) {
            this.item.imageList[i].smallShift = 20 * this.item.imageList[i].shift / 100 + 40 + delta;
        }
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.mouseMove = function (event) {
        this.posBigImage(event.offsetX, event.offsetY, event.target.clientWidth, event.target.clientHeight);
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.posBigImage = function (offsetX, offsetY, clientWidth, clientHeight) {
        var leftShift;
        var topShift;
        var flag = 0;
        if (this.mouseEntered) {
            if (this.elementLoupeFragment != null) {
                leftShift = this.elementBigImage.clientWidth / 2
                    - this.elementLoupeFragment.clientWidth * offsetX / clientWidth;
                topShift = this.elementBigImage.clientHeight / 2
                    - this.elementLoupeFragment.clientHeight * offsetY / clientHeight;
                leftShift = Math.round(leftShift);
                topShift = Math.round(topShift);
                this.elementLoupeFragment.style.left = leftShift.toString() + 'px';
                this.elementLoupeFragment.style.top = topShift.toString() + 'px';
                flag = 1;
            }
        }
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.mouseEnter = function (event) {
        var zeroIndex;
        this.elementLuope = document.getElementById('loupe');
        this.elementBigImage = document.getElementById('bigImageDiv');
        this.elementLoupeImage = document.getElementById('loupeImageDiv');
        this.elementLoupeFragment = document.getElementById('loupeImageFragment');
        this.elementLoupeImage.style.display = 'block';
        if (this.item.imageList.length == 0) {
            this.reEnter = true;
            this.offsetX = event.offsetX;
            this.offsetY = event.offsetY;
            this.clientWidth = event.target.clientWidth;
            this.clientHeight = event.target.clientHeight;
            return;
        }
        zeroIndex = this.item.imageList.findIndex(function (element) { return element.shift == 0; });
        this.loupeFragment = this.item.imageList[zeroIndex].bigImage;
        this.mouseEntered = true;
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.mouseLeave = function (event) {
        if (this.item.imageList.length == 0)
            return;
        this.elementLoupeImage.style.display = 'none';
        this.mouseEntered = false;
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.buyItem = function () {
        this.dataService.addItemToBasket(this.item);
    };
    //-----------------------------------------------------------------------------
    ItemComponent.prototype.addToCompareItem = function () {
        if (this.item.id > 0)
            this.dataService.addToComapreItem(this.item);
    };
    return ItemComponent;
}());
ItemComponent = __decorate([
    core_1.Component({
        moduleId: module.id,
        selector: 'item-component',
        templateUrl: './item.component.html',
        styleUrls: ['./item.component.css'],
    }),
    __metadata("design:paramtypes", [router_1.Router,
        router_1.ActivatedRoute,
        data_service_1.DataService])
], ItemComponent);
exports.ItemComponent = ItemComponent;
//# sourceMappingURL=item.component.js.map