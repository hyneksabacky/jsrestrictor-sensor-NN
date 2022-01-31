/** \file
 * \brief JS code for fpd report
 *
 *  \author Copyright (C) 2022  Marek Salon
 *
 *  \license SPDX-License-Identifier: GPL-3.0-or-later
 */
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
//

browser.runtime.onMessage.addListener(function (message, sender) {
    if (message.tabId && message.groups && message.latestEvals) {
        var {tabId, groups, latestEvals, exceptionWrappers} = message;
        createReport(tabId, groups, latestEvals, exceptionWrappers);
    }
    return true;
})

function createReport(tabId, groups, latestEvals, exceptionWrappers) {
	var report = document.getElementById("fpd-report");
    if (!latestEvals[tabId] || !latestEvals[tabId].evalStats) {
        report.innerHTML = "Error creating FPD report!"
        return;
    }
    
    var rootGroup = groups.recursive.name;
    var fpGroups = groups.sequential;  // fpGroups

    var processedEvals = {};
    for (let item of latestEvals[tabId].evalStats) {
        processedEvals[item.title] = processedEvals[item.title] || {};
        processedEvals[item.title].type = item.type;
        if (processedEvals[item.title].accesses) {
            processedEvals[item.title].accesses += item.accesses ? item.accesses : 0;
        }
        else {
            processedEvals[item.title].accesses = item.accesses ? item.accesses : 0;
        }
    }

    var html = "";

    let generateGroup = (group) => {
        if (processedEvals[group]) {
            if (fpGroups[group].description) {
                html += "<div id=\"" + group + "\" class=\"fpd-group\">";
                html += "<h2>" + group + "</h2>";
                html += "<p>" + fpGroups[group].description + "</p>";
            }
            for (let [item, type] of Object.entries(fpGroups[group].items)) {
                if (type == "group") {
                    generateGroup(item);
                }
                else {
                    generateResource(item)
                }
            }
            if (fpGroups[group].description) {
                html += "</div>";
            }
        }
    }

    let generateResource = (resource) => {
        if (processedEvals[resource]) {
            let accessCount = processedEvals[resource].accesses >= 1000 ? "1000+" : processedEvals[resource].accesses;
            html += "<h4>" + `${resource} - ${exceptionWrappers.includes(resource) ? "n/a" : accessCount}` + "</h4>";
        }
    }
    
    generateGroup(rootGroup);
    report.innerHTML += html;
}
