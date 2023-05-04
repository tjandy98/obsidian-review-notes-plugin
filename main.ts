import { addIcons } from "icons";
import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";

import { RecentNotes, File } from "recent-notes-interface";

import { VIEW_TYPE_REVIEW_NOTES, ReviewNotesView } from "review-notes-view";
// Remember to rename these classes and interfaces!

interface PluginSettings {
	setting: string;
}

const DEFAULT_DATA: RecentNotes = {
	files: [],
};

export default class RecentNotesPlugin extends Plugin {
	settings: PluginSettings;

	recentNotes: RecentNotes;

	reviewNotesView: ReviewNotesView;

	async onload() {
		await this.loadRecentNotes();

		// handles creation of new file and modification to existing file
		this.registerEvent(this.app.vault.on("modify", this.savePath));

		this.registerEvent(this.app.vault.on("rename", this.renamePath));

		// register custom view
		this.registerView(VIEW_TYPE_REVIEW_NOTES, (leaf) => {
			this.reviewNotesView = new ReviewNotesView(
				leaf,
				this.recentNotes,
				this
			);
			this.registerEvent(this.app.vault.on("create", this.savePath));

			return this.reviewNotesView;
		});
		addIcons();

		this.addRibbonIcon("file", "View Recent Notes", () => {
			this.activateView();
		});
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_REVIEW_NOTES);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_REVIEW_NOTES,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_REVIEW_NOTES)[0]
		);
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_REVIEW_NOTES);
	}

	savePath = async (file: TFile): Promise<void> => {
		// folder creation
		if (file.basename === undefined) {
			return;
		}

		this.recentNotes.files.findIndex(({ path }) => file.path === path) ===
		-1
			? this.recentNotes.files.push({
					path: file.path,
					filename: file.basename,
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  })
			: undefined;

		await this.saveRecentNotes();
	};

	renamePath = async (file: TFile, previousPath: string): Promise<void> => {
		const note = this.recentNotes.files.find(
			(item) => item.path === previousPath
		);

		if (note) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			note.path = file.path;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			note.filename = file.basename;

			await this.saveRecentNotes();
		}
	};

	async loadRecentNotes() {
		this.recentNotes = Object.assign(DEFAULT_DATA, await super.loadData());
	}

	async saveRecentNotes() {
		await this.saveData(this.recentNotes);
		this.reviewNotesView.onOpen();
	}
}
