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

		this.registerEvent(this.app.vault.on("create", this.savePath));

		this.registerEvent(this.app.vault.on("modify", this.savePath));

		this.registerEvent(this.app.vault.on("rename", this.renamePath));

		// register custom view
		this.registerView(VIEW_TYPE_REVIEW_NOTES, (leaf) => {
			this.reviewNotesView = new ReviewNotesView(
				leaf,
				this.recentNotes,
				this
			);
			return this.reviewNotesView;
		});

		this.addRibbonIcon("file", "View Recent Notes", () => {
			this.activateView();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
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
		const fileIndex = this.recentNotes.files.findIndex(
			(item) => item.path === previousPath
		);

		if (fileIndex != -1) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.recentNotes.files.at(fileIndex)!.path = file.path;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.recentNotes.files.at(fileIndex)!.filename = file.basename;

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

class SettingsTab extends PluginSettingTab {
	plugin: RecentNotesPlugin;

	constructor(app: App, plugin: RecentNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Review Notes Pugin - Settings" });
	}
}
