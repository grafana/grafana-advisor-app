// Code generated - EDITING IS FUTILE. DO NOT EDIT.

export interface Step {
	title: string;
	description: string;
	stepID: string;
}

export const defaultStep = (): Step => ({
	title: "",
	description: "",
	stepID: "",
});

export interface Spec {
	name: string;
	steps: Step[];
}

export const defaultSpec = (): Spec => ({
	name: "",
	steps: [],
});

