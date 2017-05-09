import { Component, 
	     OnInit }         from '@angular/core';
import { Router,
		 ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

//import { DataService }  from 'services/data.service';

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
export class ApplicationComponent implements OnInit {
	private routerListener: Subscription;
	//-----------------------------------------------------------------------------
	constructor( private router: Router ) {
	}
	//-----------------------------------------------------------------------------
	ngOnInit() {
		this.routerListener = this.router.events.subscribe( this.resizeOutlet );
	}
	//-----------------------------------------------------------------------------
	onResize( event: any ): void {
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

   		elementOutlet     = document.getElementById( 'outlerDiv' );
   		elementContacts   = document.getElementById( 'contactDiv' );
   		elementCopyRights = document.getElementById( 'copyright' );
   		elementPanelDiv = document.getElementById( 'panelDiv' );
   		if( event.url.indexOf( 'invitation' ) < 0 ) {
			elementOutlet.style.maxWidth = '1000px';
			elementContacts.style.maxWidth = '1000px';
			elementCopyRights.style.maxWidth = '1000px';
   		}
		else {
			elementOutlet.style.maxWidth = 'none';
			elementContacts.style.maxWidth = 'none';
			elementCopyRights.style.maxWidth = 'none';
		}
   		if( event.url.indexOf( 'item-list' ) >= 0 ) {
			//elementPanelDiv.style.display = 'initial';
   		}
		else {
			//elementPanelDiv.style.display = 'none';
		}
   	}
}