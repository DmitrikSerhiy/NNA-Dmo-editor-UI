import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
	selector: 'app-test-right-menu',
	templateUrl: './test-right-menu.component.html',
	styleUrls: ['./test-right-menu.component.scss']
})
export class TestRightMenuComponent implements OnInit, OnDestroy {

	@Input() rightMenuIsClosing$: Observable<void>;
	@Input() rightMenuIsOpening$: EventEmitter<void>;
	@Output() closeRightMenu = new EventEmitter<void>();
	private rightMenuOpnSubscription: Subscription;
	private rightMenuClsSubscription: Subscription;

	private unsubscribe$: Subject<void> = new Subject();

	constructor() { }

	ngOnInit() {
		this.rightMenuClsSubscription = this.rightMenuIsClosing$.subscribe(() => {
		//do some shit on close menu
		});
		this.rightMenuOpnSubscription = this.rightMenuIsOpening$.subscribe(() => {
		//do some shit on open menu
		})
	}

	ngOnDestroy(): void {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
		this.rightMenuOpnSubscription?.unsubscribe();
		this.rightMenuClsSubscription?.unsubscribe();
	}

}
