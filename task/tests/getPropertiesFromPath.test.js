const { getPropertiesFromPath } = require('../src/process');

describe('getPropertiesFromPath', () => {
  it('return correct object', () => {
    expect(getPropertiesFromPath('../campaign/deployment/platform')).toEqual(
      {
        campaign: 'campaign',
        deployment: 'deployment',
        platform_name: 'platform',
      }
    );
    expect(getPropertiesFromPath('/root/subdir/campaign/deployment/platform/')).toEqual(
      {
        campaign: 'campaign',
        deployment: 'deployment',
        platform_name: 'platform',
      }
    );
    expect(getPropertiesFromPath('/root/subdir/HS3/2012/GH (872)/')).toEqual(
      {
        campaign: 'HS3',
        deployment: '2012',
        platform_name: 'GH (872)',
      }
    );
  });
});
