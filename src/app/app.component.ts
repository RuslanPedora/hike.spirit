import { Component, 
	     OnInit,
	     OnDestroy,
	     AfterContentInit,
	     AfterViewInit,
	     AfterViewChecked } from '@angular/core';
import { Router,
		 ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { Location }       from '@angular/common';

import { DataService }  from 'hs_services/data.service';
import { Item }         from 'hs_core/item';
import { Category }     from 'hs_core/category';
import { CategoryNode } from 'hs_core/category.node';
import { Property }     from 'hs_core/property';

@Component({
	moduleId: module.id,
	selector: 'app-component',
	templateUrl: './app.component.html',
	styleUrls: [ './app.component.css' ],
	host: {
	    '(window:resize)': 'onResize($event)'
  	}	
})
//-----------------------------------------------------------------------------
export class ApplicationComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
	private routerListener: Subscription;
	private basketListener: Subscription;
	private pathListener: Subscription;
	private messageListener: Subscription;
	private total: number = 0;
	private categoryPath: any[] = [];
	private categoryNodes: CategoryNode[] = [];
	private propertyList: Property[] = [];
	private selectedProperties: Property[] = [];
	private selectedCategory: number = 0;
	private paramsToParse: any = undefined;
	private message: string = '';
	private messageShown: boolean = false;
	private colWidth: number = 200;
	private mainAreaWidth:number = 1000;

	private lowPrice: number = 0;
	private highPrice: number = 0;
	private showFilter: boolean;
	//-----------------------------------------------------------------------------
	constructor( private router: Router,
				 private activatedRoute: ActivatedRoute,
				 private dataService: DataService,
				 private location: Location ) {
	}
	//-----------------------------------------------------------------------------
	ngOnInit(): void {
		this.routerListener = this.router.events.subscribe( event => {
			this.categoryPath = [];
			this.resizeOutlet( event );		
		} );
		this.basketListener = this.dataService.basketEventSource.subscribe(
			                        	  eventValue => 
			                               this.total = this.dataService.getBasketTotal()
			                             );
		this.pathListener = this.dataService.pathEventSource.subscribe (
										  eventValue => 
										   this.categoryPath = eventValue
		)
		this.messageListener = this.dataService.messageSource.subscribe( message => this.showMessage( message ) );
		this.activatedRoute.queryParams.subscribe(
			queryParams => {				
				let categoryIdPar = queryParams [ 'categoryId' ];
				if( categoryIdPar != undefined ) {
					this.dataService.buildPath( { id: Number.parseInt( categoryIdPar ) } );					
					this.selectedCategory = categoryIdPar;
					if( this.selectedProperties.length == 0 ) {
						this.paramsToParse = queryParams;
						this.lowPrice = 0;
						this.highPrice = 0;
						this.dataService.getProperties( categoryIdPar ).then( data => this.fillPropertyList( data ) );
						let lowPrice = queryParams[ 'lowPrice' + this.dataService.getItemPrefix() ];
						if( lowPrice != undefined )
							this.lowPrice = lowPrice;
						let highPrice = queryParams[ 'highPrice' + this.dataService.getItemPrefix() ];
						if( highPrice != undefined )
							this.highPrice = highPrice;
					}
				}
				else {
					this.selectedCategory = 0;
					this.propertyList = [];
					this.selectedProperties = [];
					this.lowPrice = 0;
					this.highPrice = 0;
				}				
			}
		);				
		this.dataService.getCategoryTreeData().then( treeData => { 
			                                                       this.categoryNodes = this.buildCategoryTree( treeData, 0 );
			                                                       this.resizeSubmenu(); 
        } );
		this.total = this.dataService.getBasketTotal();
	}
	//-----------------------------------------------------------------------------
	ngAfterContentInit(): void {
		this.onResize( undefined );
	}
	//-----------------------------------------------------------------------------
	ngAfterViewInit(): void {
	}
	//-----------------------------------------------------------------------------
	ngAfterViewChecked(): void {
	}
	//-----------------------------------------------------------------------------
	ngOnDestroy() {
		this.routerListener.unsubscribe();
		this.basketListener.unsubscribe();
		this.pathListener.unsubscribe();
		this.messageListener.unsubscribe();
	}
	//-----------------------------------------------------------------------------
	showMessage( message: string ): void {
		let element: any;
		let _this: any;

		this.message = message;
		this.messageShown = true;
	}
	//-----------------------------------------------------------------------------
	hideMessage(): void {
		this.messageShown = false;
	}
	//-----------------------------------------------------------------------------
	toggleFilter( property: Property, value: any ) {
		let tempArray = [ value ];
		let tempProperty = new Property( property.id, property.name, tempArray );
		let neededPropertry: Property;

		neededPropertry = this.selectedProperties.find( element => element.id == property.id );
		if( value.selected ) {
			neededPropertry.values = neededPropertry.values.filter( element => element.value != value.value );
			if( neededPropertry.values.length == 0 )
				this.selectedProperties = this.selectedProperties.filter( element => element.id != neededPropertry.id );
		}
		else {
			if( neededPropertry == undefined )
				this.selectedProperties.push( tempProperty );
			else
				neededPropertry.values.push( value );
		}
		value.selected = !value.selected;
		this.filterByPropertis();
	}
	//--------------------------+---------------------------------------------------
	cleanSelectedValue( selectedProperty: Property, selectedValue: any ) {
		let neededPropertry: Property;
		let neededValue: any;

		neededPropertry = this.selectedProperties.find( element => element.id == selectedProperty.id );
		if( neededPropertry != undefined ) {
			neededPropertry.values = neededPropertry.values.filter( element => element.value != selectedValue.value );
			if( neededPropertry.values.length == 0 )
				this.selectedProperties = this.selectedProperties.filter( element => element.id != neededPropertry.id );
		}
		neededPropertry = this.propertyList.find( element => element.id == selectedProperty.id );
		if( neededPropertry != undefined ) {
			neededValue = neededPropertry.values.find( element => element.value == selectedValue.value );
			neededValue.selected = false;
		}
		this.filterByPropertis();
	}
	//--------------------------+---------------------------------------------------
	fillPropertyList( data: any[] ) {
		let id: number = 0;
		let name: string = '';
		let tempArray: any[];
		let tempId: number = 0;
		let valueRef: string = '';		
		let propertryRef: Property;

		this.propertyList = [];
		for( let i in data ) {
			if( id != data[ i ].id ) {
				if( id != 0 ) {
					this.propertyList.push( new Property( id, name, tempArray ) );
				}
				tempArray = [];
				id = data[ i ].id;
				name = data[ i ].name;
			}
			tempArray.push( { value: data[ i ].value, selected: false } )
		}
		if( id != 0 ) {
			this.propertyList.push( new Property( id, name, tempArray ) );
		}

		if( this.paramsToParse != undefined ){
			for( let property in this.paramsToParse )	{
				if ( property.indexOf( 'propertyId' ) >= 0 ) {
					tempId = Number.parseInt( this.paramsToParse[ property ] );
					propertryRef = this.propertyList.find( element => element.id == tempId );
					if( this.paramsToParse[ 'value' + property.replace( 'propertyId', '' ) ] instanceof Array )
						tempArray = this.paramsToParse[ 'value' + property.replace( 'propertyId', '' ) ];
					else {	
						tempArray = [];
						tempArray.push( this.paramsToParse[ 'value' + property.replace( 'propertyId', '' ) ] );
					}	
					for( let i in tempArray ) {
						valueRef = propertryRef.values.find( element => element.value == tempArray[ i ] );
						this.toggleFilter( propertryRef, valueRef );
					}
				}
			}
			this.paramsToParse = undefined;
		}
	}
	//-----------------------------------------------------------------------------
	buildCategoryTree( treeData: any[], level: number, parentId?: number ): any[] {
		let tempArray:any[] = [];
		let nodeArray:CategoryNode[] = [];		
		let currentNode: CategoryNode;
		if( level == 0 ) {
			tempArray = treeData.filter( element => element.parentId == 0 );
			for( let i in tempArray ) {
				currentNode = new CategoryNode( new Category( tempArray[ i ].categoryId, tempArray[ i ].categoryName, '' ), 
					                                          tempArray[ i ].itemCount, 
					                                          level )
				currentNode.nodes = this.buildCategoryTree( treeData, level + 1, currentNode.category.id );
				currentNode.itemCount = this.calculateItemCount( currentNode );
				nodeArray.push( currentNode );				
			}
			return nodeArray;
		}
		else {
			tempArray = treeData.filter( element => element.parentId == parentId );
			for( let i in tempArray ) {
				currentNode = new CategoryNode( new Category( tempArray[ i ].categoryId, tempArray[ i ].categoryName, '' ), 
					                                          tempArray[ i ].itemCount, 
					                                          level )
				currentNode.nodes = this.buildCategoryTree( treeData, level + 1, currentNode.category.id );
				nodeArray.push( currentNode );				
			}
			return nodeArray;
		}
	}
	//-----------------------------------------------------------------------------
	calculateItemCount( categoryNode: CategoryNode ): number {
		let result = 0;
		for( let i in categoryNode.nodes )
			result += this.calculateItemCount( categoryNode.nodes[ i ] );
		if( categoryNode.nodes.length > 0 )
			categoryNode.itemCount = result;
		else	
			result = categoryNode.itemCount;
		return result;
	}
	//-----------------------------------------------------------------------------
	goPath( pathElelement: any ) {
		let parObject = {};
		if( pathElelement.hasOwnProperty( 'mainImage' ) ) {
		}
		else {
			parObject[ 'categoryId' ] = pathElelement.id;		
			this.router.navigate( [ '/item-list' ], { queryParams: parObject } );
		}
	}
	//-----------------------------------------------------------------------------
	onResize( event: any ): void {
		let homeButton: any;
		let forwardButton: any;
		let searchInput: any;
		let basketBar: any;
		let elementPanelDiv: any;

		searchInput = document.getElementById( 'searchInput' );
		homeButton  = document.getElementById( 'homeNavButton' );
		basketBar   = document.getElementById( 'basketBar' );
		
		elementPanelDiv = document.getElementById( 'panelDiv' );
		if( elementPanelDiv != undefined )
			this.mainAreaWidth = elementPanelDiv.clientWidth;

		forwardButton = document.getElementById( 'forwardNavButton' );			
		searchInput.style.width = ( forwardButton.offsetLeft + forwardButton.clientWidth - homeButton.offsetLeft - 40 + 1 ).toString() + 'px';
		this.resizeSubmenu();
 	}
   	//-----------------------------------------------------------------------------
   	resizeSubmenu(): void {
   		let maxSubmenuCol = 0;
   		this.mainAreaWidth = Math.min( window.innerWidth, 1000 );
   		maxSubmenuCol = Math.floor( this.mainAreaWidth / this.colWidth );
   		for( let i in this.categoryNodes ) {
   			this.categoryNodes[ i ].submenuWidth = Math.min( maxSubmenuCol, this.categoryNodes[ i ].nodes.length ) * this.colWidth;
   		}
   	}
   	//-----------------------------------------------------------------------------
   	gotoBasket(): void {
   		this.router.navigate( [ '/basket' ] );
   	}
   	//-----------------------------------------------------------------------------
   	resizeOutlet( event: any ):void {
   		let elementOutlet: any;
   		let elementContacts: any;
   		let elementCopyRights: any;
   		let elementPanelDiv: any;
   		let elementBGImage: any;
   		let elementCategoryTree: any;

   		elementOutlet     = document.getElementById( 'outlerDiv' );
   		elementContacts   = document.getElementById( 'contactDiv' );
   		elementCopyRights = document.getElementById( 'copyright' );
   		elementPanelDiv = document.getElementById( 'panelDiv' );
   		elementBGImage = document.getElementById( 'mainBgImage' );
   		elementCategoryTree = document.getElementById( 'categoryTree' );

   		if( event.url.indexOf( 'invitation' ) >= 0 || event.url == '/') {
			elementOutlet.style.maxWidth = '100%';
			elementContacts.style.maxWidth = '100%';
			elementCopyRights.style.maxWidth = '100%';
			elementPanelDiv.style.display = 'none';
			elementCategoryTree.style.display = 'none';
			this.categoryPath = [];
   		}
		else {
			elementOutlet.style.maxWidth = '1000px';
			elementContacts.style.maxWidth = '1000px';
			elementCopyRights.style.maxWidth = '1000px';
			elementPanelDiv.style.display = 'block';
			if( event.url.indexOf( 'category-list' ) >= 0 || event.url == '/')
				elementCategoryTree.style.display = 'none';
			else
				elementCategoryTree.style.display = 'block';

		}
   		if( event.url.indexOf( 'category-list' ) >= 0 ) {
			elementBGImage.style.opacity = '.8';
   		}
		else {
			elementBGImage.style.opacity = '1';
		}
		if( event.url.indexOf( 'item-list' ) < 0 ) {
			this.selectedProperties = [];
			this.propertyList = [];
			this.showFilter = false;
		}	
		else
			this.showFilter = true; 
   	}
   	//-----------------------------------------------------------------------------
   	scrollTop():void {
	   	window.scrollTo( 0, 0 );
    }
    //-----------------------------------------------------------------------------
    subscribe(): void {
         this.showMessage( 'You have subscribed' );   		
    }
    //-----------------------------------------------------------------------------
    searchItem( searchKey: string ): void {
		let parObject = {};
		let keyAsNumber: any;
		parObject[ 'name' + this.dataService.getItemPrefix() ] = searchKey;
		
		keyAsNumber = Number.parseInt( searchKey );
		if( !isNaN( keyAsNumber ) )
			parObject[ 'searchId' + this.dataService.getItemPrefix() ] = searchKey;
		if( searchKey == '' )
			this.router.navigate( [ '/item-list' ] );
		else	
			this.router.navigate( [ '/item-list' ], { queryParams: parObject } );
    }
 	//-----------------------------------------------------------------------------
 	scrollDown(): void {
 		window.scrollTo( 0, document.body.scrollHeight );
 	}
 	//-----------------------------------------------------------------------------
 	back():void {
		this.location.back();
 	}
 	//-----------------------------------------------------------------------------
 	forward():void {
		this.location.forward();
 	}
	//-----------------------------------------------------------------------------
	gotoCategory( selectedCategory: Category ) {
		let parObject = {};
		parObject[ 'categoryId' ] = selectedCategory.id;
		this.router.navigate( [ '/item-list' ], { queryParams: parObject } );
		this.selectedProperties = [];
		this.propertyList = [];
	}
	//-----------------------------------------------------------------------------
	filterByPropertis(): void {
		let parObject = {};
		let tempArray: any[] = [];
		parObject[ 'categoryId' ] = this.selectedCategory;
		if( this.lowPrice > 0 )
			parObject[ 'lowPrice' + this.dataService.getItemPrefix() ] = this.lowPrice;
		if( this.highPrice > 0 )
			parObject[ 'highPrice' + this.dataService.getItemPrefix() ] = this.highPrice;
		for( let i in this.selectedProperties ) {
			tempArray = [];
			for( let j in this.selectedProperties[ i ].values )
				tempArray.push( this.selectedProperties[ i ].values[ j ].value );
			parObject[ 'propertyId' + i ] = this.selectedProperties[ i ].id;
			parObject[ 'value' + i ] = tempArray;
		}
		this.router.navigate( [ '/item-list' ], { queryParams: parObject } );
	}
	//-----------------------------------------------------------------------------
	cleanLowPrice(): void {
		this.lowPrice = 0;
		this.filterByPropertis();
	}
	//-----------------------------------------------------------------------------
	cleanHighPrice(): void {
		this.highPrice = 0;
		this.filterByPropertis();
	}
	//-----------------------------------------------------------------------------
}