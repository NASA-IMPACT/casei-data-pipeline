import fs from 'fs';
import path from 'path';
import {
  array,
  assert,
  boolean,
  number,
  object,
  optional,
  string,
} from 'superstruct';

import { readCampaignYaml } from '../src/utils';

const structure = array(
  object({
    name: string(),
    platforms: array(
      object({
        name: string(),
        tsv_format: optional(boolean()),
        rename_as_ict: optional(boolean()),
        process_as_ict: optional(boolean()),
        use_python_hdf: optional(boolean()),
        filter_kmz: optional(boolean()),
        coords_divisor: optional(number()),
        data_start_line_fix: optional(number()),
        header_content: optional(string()),
        latitude_field: optional(string()),
        longitude_field: optional(string()),
        time_field: optional(string()),
        set_file_extension: optional(string()),
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
