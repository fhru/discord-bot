const { PermissionFlagsBits } = require('discord.js');

function isAdmin(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function hasRole(member, roleId) {
  if (!member || !roleId) return false;
  return member.roles.cache.has(roleId);
}

module.exports = {
  isAdmin,
  hasRole
};
