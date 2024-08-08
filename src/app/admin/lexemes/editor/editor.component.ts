// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { DataService } from '@app/admin/_services/data.service';
import { LexemeService } from '@app/admin/_services/lexeme.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TabGeneralComponent } from '../tab-1-general/tab-general.component';
import { TabVariantsComponent } from '../tab-2-variants/tab-variants.component';
import { TabSememesComponent } from '../tab-3-sememes/tab-sememes.component';
import { TabMappingsComponent } from '../tab-4-mappings/tab-mappings.component';
import { TransferStop } from '../view/view.component';
import { MatBadge } from '@angular/material/badge';
import { TranslocoDirective } from '@jsverse/transloco';

export let SHOW_CHANGE_DATA = false;

@Component({
    selector: 'admin-lexeme-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    standalone: true,
    imports: [TranslocoDirective, MatTabGroup, MatTab, MatTabLabel, MatBadge, TabGeneralComponent, TabVariantsComponent, TabSememesComponent, TabMappingsComponent]
})
export class EditorComponent implements OnInit, AfterViewInit
{
	@ViewChild('editorTabs')
	tabGroup: MatTabGroup;

	@ViewChild('tabGeneral')
	private tabGeneral: TabGeneralComponent;

	@ViewChild('tabVariants')
	private tabVariants: TabVariantsComponent;

	@ViewChild('tabSememes')
	private tabSememes: TabSememesComponent;

	@ViewChild('tabMappings')
	private tabMappings: TabMappingsComponent;

	constructor(public readonly lexemeService: LexemeService,
		private readonly data: DataService) {}

	ngOnInit(): void
	{
	}

	ngAfterViewInit(): void
	{
		this.tabSememes.variantSupply = this.tabVariants;
		this.tabMappings.sememeSupply = this.tabSememes;
	}

	selectTab(index: number) : void
	{
		this.tabGroup.selectedIndex = index;
	}

	readFromService() : Observable<void>
	{
		return this.lexemeService.getActiveLexeme()
			.pipe(
				map((detailedLexeme => {
					if (detailedLexeme) {
						// Data for the general tab
						this.tabGeneral.readFromService(detailedLexeme.lexeme);
						// Data for the variants tab (type and language must be transported to this)
						this.tabVariants.readFromService(detailedLexeme.lexeme?.typeID, detailedLexeme.lexeme?.langID,
							detailedLexeme.variants);
						// Data for the sememes tab
						this.tabSememes.readFromService(detailedLexeme.lexeme?.typeID, detailedLexeme.lexeme?.langID,
							detailedLexeme.sememes);
						// Data for the mappings tab
						this.tabMappings.readFromService(detailedLexeme.lexeme?.typeID, detailedLexeme.lexeme?.langID,
							detailedLexeme.mappings);
					}
			})));
	}

	writeToService(doValidation: boolean) : TransferStop[]
	{
		// TODO by't torügskryven bedenken wat dee saken uut de vorskillen tabs inholden in't lexeme öäverskryven kunden
		let result: TransferStop[] = [];
		result.concat(this.tabGeneral.writeToService(doValidation));
		result.concat(this.tabVariants.writeToService(doValidation));
		result.concat(this.tabSememes.writeToService(doValidation));
		result.concat(this.tabMappings.writeToService(doValidation));
		return result;
	}

	resetComponent() : void
	{
		this.tabGeneral.resetComponent();
		this.tabVariants.resetComponent();
		this.tabSememes.resetComponent();
		this.tabMappings.resetComponent();
	}

	typeSelected(typeID: number)
	{
		this.tabVariants.basedOnType = typeID;
		this.tabSememes.basedOnType = typeID;
		this.tabMappings.basedOnType = typeID;
	}

	languageSelected(languageID: number)
	{
		this.tabVariants.basedOnLanguage = languageID;
		this.tabSememes.basedOnLanguage = languageID;
		this.tabMappings.basedOnLanguage = languageID;
	}
}