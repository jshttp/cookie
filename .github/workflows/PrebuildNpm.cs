// --------------------------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// --------------------------------------------------------------------------------------------

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Microsoft.Terrapin.Worker.PrebuildLogic
{
    /// <summary>
    /// A class that contains the logic need to execute before starting a build for an NPM package.
    /// The program looks for the files in the directory in which it was invoked, not necessarily where the prebuild logic is.
    /// </summary>
    public static class PrebuildNpm
    {
        public const string LockFileName = "package-lock.json";
        public const string PackageFileName = "package.json";
        public const string NpmrcFileName = ".npmrc";
        public const string IntegrityField = "integrity";
        public const string PrivateField = "private";
        public const string SectionSeparator = "######";

        /// <summary>
        /// A method to remove the field "private" from a package.json file because it prevents us from running `npm publish` on the resulting tarball.
        /// </summary>
        public static async Task RemovePrivateField()
        {
            var pkgTxt = await File.ReadAllTextAsync(PackageFileName);
            var packageData = JsonSerializer.Deserialize<Dictionary<string, object>>(pkgTxt);
            if (!packageData.ContainsKey(PrivateField))
            {
                Console.WriteLine($"{SectionSeparator} {PackageFileName} does not contain '{PrivateField}' field.");
                return;
            }

            packageData.Remove(PrivateField);
            Console.WriteLine($"{SectionSeparator} Removed '{PrivateField}' field from {PackageFileName}.");
            await File.WriteAllTextAsync(PackageFileName, JsonSerializer.Serialize(packageData));
        }

        /// <summary>
        /// A method to clean the .npmrc file in case it contains 'package-lock=false'.
        /// If this parameter is set, it prevents Terrapin from executing validations properly.
        /// </summary>
        public static async Task RemovePackageLockFalse()
        {
            const string packageLockFalse = "package-lock=false";
            const string packageLockFalseRx = @"package-lock\s?=\s?false\r?\n?";
            Regex rx = new Regex(packageLockFalseRx, RegexOptions.Compiled);

            Console.WriteLine($"Checking if {NpmrcFileName} contains '{packageLockFalseRx}'.");

            var fileText = await File.ReadAllTextAsync(NpmrcFileName);
            var matches = rx.Matches(fileText);

            if (matches.Count == 0)
            {
                Console.WriteLine($"{SectionSeparator} {NpmrcFileName} did not contain ${packageLockFalse}.");
                return;
            }

            Console.WriteLine($"Trying to remove '{packageLockFalse}'");

            var cleanText = rx.Replace(fileText, string.Empty);
            await File.WriteAllTextAsync(NpmrcFileName, cleanText);

            Console.WriteLine($"{SectionSeparator} Successfully rewrote {NpmrcFileName} without {packageLockFalse}.");
        }

        /// <summary>
        /// A method to orchastrate all the required pre-build steps for NPM packages.
        /// </summary>
        public static async Task Main()
        {
            if (File.Exists(PackageFileName))
            {
                Console.WriteLine($"{SectionSeparator} Removing {PrivateField} from {PackageFileName}, to resolve the build issues caused by private packages");
                await RemovePrivateField();
            }
            else
            {
                Console.WriteLine($"{SectionSeparator} {PackageFileName} file not found");
            }

            if (File.Exists(NpmrcFileName))
            {
                Console.WriteLine($"{SectionSeparator} Found {NpmrcFileName}, attempting a cleanup...");
                await RemovePackageLockFalse();
            }
            else
            {
                Console.WriteLine($"{SectionSeparator} {NpmrcFileName} file not found");
            }
        }
    }
}
