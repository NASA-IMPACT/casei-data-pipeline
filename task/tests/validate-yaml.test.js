const fs = require('fs');
const path = require('path');
const {
  array,
  assert,
  boolean,
  number,
  object,
  optional,
  string,
} = require('superstruct');
const { readCampaignYaml } = require('../src/utils');

const structure = array(
  object({
    name: string(),
    platforms: array(
      object({
        name: string(),
        tsv_format: optional(boolean()),
        rename_as_ict: optional(boolean()),
        process_as_ict: optional(boolean()),
        coords_divisor: optional(number()),
        data_start_line_fix: optional(number()),
        header_content: optional(string()),
        files: array(string()),
      })
    ),
  })
);

test('YAML files should be valid', () => {
  const campaigns = fs.readdirSync('../campaigns/');
  campaigns
    .filter((c) => fs.existsSync(path.join('../campaigns/', c, 'deployments.yaml')))
    .forEach((c) => {
      console.log(`Checking: ${c}`);
      assert(readCampaignYaml(path.join('../campaigns/', c)), structure);
    });
});
