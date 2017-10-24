'use strict';

(function () {
  // Authentication controller Spec
  describe('AuthenticationController', function () {
    // Initialize global variables
    var AuthenticationController,
      scope,
      $httpBackend,
      $stateParams,
      $state,
      $location;

    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Load the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    describe('Logged out user', function () {
      // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
      // This allows us to inject a service but then attach it to a variable
      // with the same name as the service.
      beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
        // Set a new global scope
        scope = $rootScope.$new();

        // Point global variables to injected services
        $stateParams = _$stateParams_;
        $httpBackend = _$httpBackend_;
        $location = _$location_;

        $httpBackend.when('GET', '/api/users/me').respond(200, {});

        // Ignore parent template get on state transitions
        $httpBackend.whenGET('/modules/core/client/views/home.client.view.html').respond(200);
        $httpBackend.whenGET('/modules/core/client/views/400.client.view.html').respond(200);

        // Initialize the Authentication controller
        AuthenticationController = $controller('AuthenticationController as vm', {
          $scope: scope
        });
      }));

      describe('$scope.signin()', function () {
        it('should login with a correct user and password', inject(function ($templateCache) {
          $templateCache.put('/modules/core/client/views/home.client.view.html', '');
          // Test expected GET request
          $httpBackend.when('POST', '/api/auth/signin').respond(200, {
            user: 'Fred'
          });
          $httpBackend.when('GET', '/api/users/me').respond(200, 'Fred');

          scope.vm.signin(true);
          $httpBackend.flush();

          // Test scope value
          expect(scope.vm.authentication.user).toEqual('Fred');
          expect($location.url()).toEqual('/');
        }));

        it('should login with a correct email and password', inject(function ($templateCache) {
          $templateCache.put('/modules/core/client/views/home.client.view.html', '');
          // Test expected GET request
          $httpBackend.when('POST', '/api/auth/signin').respond(200, {
            user: 'Fred@email.com'
          });
          $httpBackend.when('GET', '/api/users/me').respond(200, 'Fred');

          scope.vm.signin(true);
          $httpBackend.flush();

          // Test scope value
          expect(scope.vm.authentication.user).toEqual('Fred@email.com');
          expect($location.url()).toEqual('/');
        }));

        it('should be redirected to previous state after successful login',
          inject(function (_$state_) {
            $state = _$state_;
            $state.previous = {
              state: {
                name: 'articles.create'
              },
              params: {},
              href: '/articles/create'
            };

            spyOn($state, 'transitionTo');
            spyOn($state, 'go');

            // Test expected GET request
            $httpBackend.when('POST', '/api/auth/signin').respond(200, {
              user: 'Fred'
            });
            $httpBackend.when('GET', '/api/users/me').respond(200, {
              user: 'Fred'
            });

            scope.vm.signin(true);
            $httpBackend.flush();

            // Test scope value
            expect($state.go).toHaveBeenCalled();
            expect($state.go).toHaveBeenCalledWith($state.previous.state.name, $state.previous.params);

          }));

        it('should fail to log in with nothing', function () {
          // Test expected POST request
          $httpBackend.expectPOST('/api/auth/signin').respond(400, {
            'message': 'Missing credentials'
          });

          scope.vm.signin(true);
          $httpBackend.flush();

          // Test scope value
          expect(scope.vm.error).toEqual('Missing credentials');
        });

        it('should fail to log in with wrong credentials', function () {
          // Foo/Bar combo assumed to not exist
          scope.vm.authentication.user = 'Foo';
          scope.vm.credentials = 'Bar';

          // Test expected POST request
          $httpBackend.expectPOST('/api/auth/signin').respond(400, {
            'message': 'Unknown user'
          });

          scope.vm.signin(true);
          $httpBackend.flush();

          // Test scope value
          expect(scope.vm.error).toEqual('Unknown user');
        });
      });

      describe('$scope.signup()', function () {
        it('should register with correct data', inject(function ($templateCache) {
          $templateCache.put('/modules/core/client/views/home.client.view.html', '');
          // Test expected GET request
          scope.vm.authentication.user = 'Fred';
          $httpBackend.when('POST', '/api/auth/signup').respond(200, {
            user: 'Fred'
          });
          $httpBackend.when('GET', '/api/users/me').respond(200, {
            user: 'Fred'
          });

          scope.vm.signup(true);
          $httpBackend.flush();

          // test scope value
          expect(scope.vm.authentication.user).toBe('Fred');
          expect(scope.vm.error).toEqual(null);
          expect($location.url()).toBe('/');
        }));

        it('should fail to register with duplicate Username', function () {
          // Test expected POST request
          $httpBackend.when('POST', '/api/auth/signup').respond(400, {
            'message': 'Username already exists'
          });

          scope.vm.signup(true);
          $httpBackend.flush();

          // Test scope value
          expect(scope.vm.error).toBe('Username already exists');
        });
      });
    });

    describe('Logged in user', function () {
      beforeEach(inject(function ($controller, $rootScope, _$location_, _Authentication_) {
        scope = $rootScope.$new();

        $location = _$location_;
        $location.path = jasmine.createSpy().and.returnValue(true);

        $httpBackend.when('GET', '/api/users/me').respond(200, {});

        // Mock logged in user
        _Authentication_.user = {
          username: 'test',
          roles: ['user']
        };

        AuthenticationController = $controller('AuthenticationController as vm', {
          $scope: scope
        });
      }));

      it('should be redirected to home', function () {
        expect($location.path).toHaveBeenCalledWith('/');
      });
    });
  });
}());
