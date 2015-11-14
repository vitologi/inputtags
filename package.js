Package.describe({
  name: 'vitologi:inputtags',
  version: '0.0.1',
  summary: 'Converts your input to field of tags.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles(['inputtags.js', 'inputtags.css'], 'client');
});

