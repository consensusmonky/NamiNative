import * as Keychain from 'react-native-keychain';


   export async function storeCredentials(username: string, password: string): Promise<false | Keychain.Result> {
        
      try {
      return Keychain.setGenericPassword(username, password);

      } catch (error) {
        console.log('Keychain couldn\'t be accessed!', error);
        return new Promise((_, reject) => reject('Keychain couldn\'t be accessed!'));
      }
  }

  export async function credentialsAvailable(): Promise<false | Keychain.UserCredentials> {
      
      try {
          const credentials = await Keychain.getGenericPassword();
          if (credentials) {
            return credentials;
          }

      } catch (error) {
        console.log('Keychain couldn\'t be accessed!', error);
        return new Promise((_, reject) => reject('Keychain couldn\'t be accessed!'));
      }
      return new Promise((resolve) => resolve(false));
    }


    export async function validateCredentials(username: string, password: string): Promise<false | Keychain.UserCredentials | PromiseLike<false | Keychain.UserCredentials>> {
  
      try {
          // Retreive the credentials
          const credentials = await Keychain.getGenericPassword();
          if (credentials) {
          console.log('Credentials successfully loaded for user ' + credentials.username);
          } else {
          return new Promise((resolve) => resolve(false));
          }

          return new Promise((resolve) => resolve(credentials));
      } catch (error) {
          console.log('Keychain couldn\'t be accessed!', error);
          return new Promise((_, reject) => reject('Keychain couldn\'t be accessed!'));
      }
  }

