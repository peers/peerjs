export const validateId = (id: string): boolean => {
	// Allow empty ids
	return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
};
